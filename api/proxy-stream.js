import { Readable } from 'node:stream';

// Vercel runtime config:
//  - bodyParser off: GET handler doesn't need it.
//  - responseLimit off: MJPEG is potentially long-lived/unbounded.
//
// NOTE: On Vercel Hobby/Pro the *function* execution wall-clock is capped
// (10s/60s respectively). MJPEG streams will be killed when that cap is
// reached. The 10s timeout below is for the *initial connection*, not for
// the lifetime of the stream — once headers arrive, the timer is cleared.
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const CONNECT_TIMEOUT_MS = 10_000;

// RFC1918 private IPv4 ranges:
//   10.0.0.0/8    → 10.x.x.x
//   172.16.0.0/12 → 172.16-31.x.x
//   192.168.0.0/16 → 192.168.x.x
//
// We require an IPv4 *literal* (no DNS lookups, no IPv6, no decimal/hex
// notation) so the SSRF check can't be bypassed by a hostname that resolves
// to a public address (DNS rebinding) or an alternative IP encoding.
const PRIVATE_IP_PATTERNS = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
];

function isPrivateIPv4(host) {
  if (typeof host !== 'string') return false;
  if (!PRIVATE_IP_PATTERNS.some((re) => re.test(host))) return false;
  // Octet-bounds check (regex above allows 0–999 per octet).
  const parts = host.split('.');
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = req.query?.url;
  const target = Array.isArray(raw) ? raw[0] : raw;
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Missing "url" query parameter.' });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return res.status(400).json({ error: 'Invalid URL.' });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http(s) URLs are allowed.' });
  }

  if (!isPrivateIPv4(parsed.hostname)) {
    return res.status(403).json({
      error: 'Only RFC1918 private IPv4 addresses are allowed.',
    });
  }

  // Connection-timeout controller. Cleared once headers arrive so MJPEG
  // streams aren't aborted mid-flight.
  const controller = new AbortController();
  const connectTimer = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(parsed.toString(), {
      method: 'GET',
      signal: controller.signal,
      // No credentials/headers forwarded — this is a one-way proxy.
    });
  } catch (err) {
    clearTimeout(connectTimer);
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream connection timeout.' });
    }
    return res.status(502).json({
      error: 'Upstream fetch failed.',
      message: err?.message,
    });
  }
  clearTimeout(connectTimer);

  if (!upstream.ok) {
    return res
      .status(upstream.status)
      .json({ error: `Upstream returned ${upstream.status}.` });
  }

  // Preserve the upstream Content-Type — critical for MJPEG, where it carries
  // the multipart boundary that lets <img> render successive frames.
  const ct = upstream.headers.get('content-type');
  if (ct) res.setHeader('Content-Type', ct);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200);

  if (!upstream.body) {
    return res.end();
  }

  const nodeStream = Readable.fromWeb(upstream.body);

  // Tear down the upstream stream if the browser drops the connection.
  const cleanup = () => {
    try {
      controller.abort();
    } catch {
      /* ignore */
    }
    try {
      nodeStream.destroy();
    } catch {
      /* ignore */
    }
  };
  res.on('close', cleanup);

  nodeStream.on('error', (err) => {
    console.error('proxy-stream upstream stream error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Stream error.' });
    } else {
      try {
        res.end();
      } catch {
        /* ignore */
      }
    }
  });

  nodeStream.pipe(res);
}
