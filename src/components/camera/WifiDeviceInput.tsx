import { useEffect, useRef, useState } from 'react';

const PATHS = [
  '/stream',
  '/video',
  '/mjpeg',
  '/videostream',
  '/mjpg/video.mjpg',
];
const STORAGE_KEY = 'rc-bioscan:lastWifiIp';
const TIMEOUT_MS = 3000;

type Status = 'idle' | 'testing' | 'connected' | 'error';

export interface WifiDeviceInputProps {
  /** Called with the full URL (base + path) that successfully responded. */
  onConnect: (fullUrl: string) => void;
}

function buildBase(ip: string): string {
  const trimmed = ip.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  return `http://${trimmed.replace(/\/+$/, '')}`;
}

/**
 * Probe a candidate URL using `<img>` rather than `fetch`/HEAD because:
 *  - `<img>` doesn't enforce CORS for the load event itself;
 *  - many MJPEG endpoints return `multipart/x-mixed-replace` which `fetch`
 *    can't easily test, but a browser still renders a first frame as an image.
 */
function probe(url: string, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      img.onload = null;
      img.onerror = null;
      img.src = '';
      resolve(ok);
    };

    if (signal.aborted) return finish(false);
    signal.addEventListener('abort', () => finish(false), { once: true });

    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
  });
}

export default function WifiDeviceInput({ onConnect }: WifiDeviceInputProps) {
  const [ip, setIp] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const runAbortRef = useRef<AbortController | null>(null);

  // Restore last-used IP from localStorage on mount.
  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last) setIp(last);
    } catch {
      /* localStorage may be disabled (private mode); ignore. */
    }
  }, []);

  // Cancel any in-flight probe sequence on unmount.
  useEffect(() => {
    return () => runAbortRef.current?.abort();
  }, []);

  async function handleConnect(): Promise<void> {
    const base = buildBase(ip);
    if (!base) {
      setStatus('error');
      setErrMsg('Informe um IP válido.');
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, ip.trim());
    } catch {
      /* ignore */
    }

    runAbortRef.current?.abort();
    const runCtrl = new AbortController();
    runAbortRef.current = runCtrl;

    setStatus('testing');
    setErrMsg(null);
    setCurrentPath(null);

    for (const path of PATHS) {
      if (runCtrl.signal.aborted) return;

      const url = `${base}${path}`;
      setCurrentPath(path);

      // Per-path timeout: independent controller chained to the run-level one.
      const probeCtrl = new AbortController();
      const onRunAbort = () => probeCtrl.abort();
      runCtrl.signal.addEventListener('abort', onRunAbort, { once: true });
      const timer = setTimeout(() => probeCtrl.abort(), TIMEOUT_MS);

      const ok = await probe(url, probeCtrl.signal);
      clearTimeout(timer);
      runCtrl.signal.removeEventListener('abort', onRunAbort);

      if (runCtrl.signal.aborted) return;
      if (ok) {
        setStatus('connected');
        setCurrentPath(null);
        onConnect(url);
        return;
      }
    }

    setStatus('error');
    setCurrentPath(null);
    setErrMsg('Nenhum endpoint MJPEG respondeu nesse IP.');
  }

  const isTesting = status === 'testing';

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <label className="text-sm text-slate-300 block">
        Endereço IP do dispositivo WiFi
      </label>
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="192.168.1.100"
          className="flex-1 bg-slate-900/70 border border-amber-400/30 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-300/70"
          disabled={isTesting}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isTesting && ip.trim()) {
              handleConnect();
            }
          }}
        />
        <button
          type="button"
          onClick={handleConnect}
          disabled={isTesting || ip.trim().length === 0}
          className="gold-gradient px-4 py-2.5 rounded-xl text-slate-900 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? 'Testando...' : 'Conectar'}
        </button>
      </div>

      {isTesting && currentPath && (
        <p className="text-xs text-amber-200 flex items-center gap-2">
          <span className="w-3 h-3 border border-amber-300 border-t-transparent rounded-full animate-spin" />
          Tentando <code className="text-amber-100">{currentPath}</code>...
        </p>
      )}
      {status === 'connected' && (
        <p className="text-xs text-emerald-300">✓ Conectado</p>
      )}
      {status === 'error' && errMsg && (
        <p className="text-xs text-red-300">⚠ {errMsg}</p>
      )}
    </div>
  );
}
