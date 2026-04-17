import React, { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const HISTORY_KEY = 'rc-bioscan:wifi-history';
const MAX_SAVED = 5;
const PROBE_TIMEOUT = 4000;
const SCAN_TIMEOUT = 2000;
const SCAN_BATCH = 15;

const COMMON_PORTS = [80, 8080, 81, 8081, 88, 8000, 8888, 4747, 5000];

const MJPEG_PATHS = [
  '/video', '/stream', '/mjpeg', '/videostream',
  '/mjpg/video.mjpg', '/video.mjpg', '/cam.mjpg',
  '/camera/mjpeg', '/axis-cgi/mjpg/video.cgi',
  '/videostream.cgi', '/mjpg/1/video.mjpg', '/',
];

const SNAPSHOT_PATHS = [
  '/snapshot.jpg', '/capture', '/shot.jpg', '/cam.jpg',
  '/image.jpg', '/jpg/image.jpg', '/cgi-bin/snapshot.cgi',
  '/Streaming/Channels/1/picture', '/axis-cgi/jpg/image.cgi',
  '/snap.jpg', '/photo.jpg',
];

const SCAN_PATHS = ['/video', '/stream', '/mjpeg', '/snapshot.jpg'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WifiStreamKind = 'mjpeg' | 'snapshot';

interface SavedDevice {
  ip: string;
  port?: number;
  path?: string;
  kind?: WifiStreamKind;
  lastUsed: number;
}

export interface WifiDeviceInputProps {
  onConnect: (url: string, kind: WifiStreamKind) => void;
  onDisconnect: () => void;
  connected: boolean;
}

// ---------------------------------------------------------------------------
// Probe helpers
// ---------------------------------------------------------------------------

function isSecure(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

function proxify(rawUrl: string): string {
  return `/api/proxy-stream?url=${encodeURIComponent(rawUrl)}`;
}

function classifyPath(path: string): WifiStreamKind {
  if (/\.(jpg|jpeg|png|bmp|gif)$/i.test(path)) return 'snapshot';
  if (/snapshot|capture|shot|image|picture|photo/i.test(path)) return 'snapshot';
  return 'mjpeg';
}

function imgProbe(url: string, timeout: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      img.onload = null;
      img.onerror = null;
      img.src = '';
      resolve(ok);
    };
    if (signal?.aborted) return finish(false);
    signal?.addEventListener('abort', () => finish(false), { once: true });
    const timer = setTimeout(() => finish(false), timeout);
    img.onload = () => { clearTimeout(timer); finish(true); };
    img.onerror = () => { clearTimeout(timer); finish(false); };
    img.src = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
  });
}

interface ProbeHit { url: string; kind: WifiStreamKind }

async function probeWithStrategies(
  rawHttpUrl: string,
  path: string,
  timeout: number,
  signal?: AbortSignal,
): Promise<ProbeHit | null> {
  const kind = classifyPath(path);

  // Direct probe (works on HTTP pages, Firefox HTTPS, or if user allowed insecure content)
  if (await imgProbe(rawHttpUrl, timeout, signal)) {
    return { url: rawHttpUrl, kind };
  }

  // Proxy probe (works for self-hosted deployments where proxy can reach LAN)
  if (isSecure()) {
    const proxied = proxify(rawHttpUrl);
    if (await imgProbe(proxied, timeout, signal)) {
      return { url: proxied, kind };
    }
  }

  return null;
}

async function probeIp(
  rawInput: string,
  signal: AbortSignal,
  onStatus?: (msg: string) => void,
): Promise<ProbeHit | null> {
  const clean = rawInput.trim().replace(/^https?:\/\//, '');
  const hostPart = clean.split('/')[0];
  const hasPort = /:\d+/.test(hostPart);
  const hasPath = clean.includes('/');
  const userPath = hasPath ? '/' + clean.split('/').slice(1).join('/') : null;

  const ports = hasPort ? [0] : COMMON_PORTS;
  const paths = userPath ? [userPath] : [...MJPEG_PATHS, ...SNAPSHOT_PATHS];

  for (const port of ports) {
    if (signal.aborted) return null;
    const host = port === 0 ? hostPart : `${hostPart}:${port}`;

    for (const path of paths) {
      if (signal.aborted) return null;
      const rawUrl = `http://${host}${path}`;
      onStatus?.(`${host}${path}`);

      const hit = await probeWithStrategies(rawUrl, path, PROBE_TIMEOUT, signal);
      if (hit) return hit;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Network scan
// ---------------------------------------------------------------------------

async function scanSubnet(
  subnet: string,
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
  onFound: (ip: string, hit: ProbeHit) => void,
): Promise<void> {
  const total = 254;
  let done = 0;

  for (let batch = 1; batch <= 254; batch += SCAN_BATCH) {
    if (signal.aborted) return;
    const hosts: number[] = [];
    for (let i = batch; i < batch + SCAN_BATCH && i <= 254; i++) hosts.push(i);

    await Promise.all(hosts.map(async (n) => {
      if (signal.aborted) return;
      const ip = `${subnet}.${n}`;

      for (const path of SCAN_PATHS) {
        if (signal.aborted) return;
        const rawUrl = `http://${ip}${path}`;
        const hit = await probeWithStrategies(rawUrl, path, SCAN_TIMEOUT, signal);
        if (hit) {
          onFound(ip, hit);
          return;
        }
      }
      done++;
      onProgress(done, total);
    }));
  }
}

function extractSubnet(ip: string): string | null {
  const m = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}/);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

function loadHistory(): SavedDevice[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

function saveHistory(ip: string, kind?: WifiStreamKind): void {
  try {
    const h = loadHistory().filter(d => d.ip !== ip);
    h.unshift({ ip, kind, lastUsed: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_SAVED)));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WifiDeviceInput: React.FC<WifiDeviceInputProps> = ({
  onConnect,
  onDisconnect,
  connected,
}) => {
  const [ip, setIp] = useState('');
  const [testing, setTesting] = useState(false);
  const [probeInfo, setProbeInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedDevice[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [subnet, setSubnet] = useState('192.168.1');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFound, setScanFound] = useState<Array<{ ip: string; hit: ProbeHit }>>([]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const h = loadHistory();
    setHistory(h);
    if (h.length > 0 && !ip) setIp(h[0].ip);
  }, []);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleConnect = useCallback(async () => {
    const trimmed = ip.trim();
    if (!trimmed) { setError('Informe um IP ou URL.'); return; }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setError(null);
    setTesting(true);
    setProbeInfo(null);

    const hit = await probeIp(trimmed, ctrl.signal, setProbeInfo);

    if (ctrl.signal.aborted) return;
    setTesting(false);
    setProbeInfo(null);

    if (!hit) {
      const isHttps = isSecure();
      setError(
        isHttps
          ? 'Nenhum endpoint respondeu. Em sites HTTPS, o navegador bloqueia conexões HTTP com dispositivos locais. Veja o guia abaixo.'
          : 'Nenhum endpoint respondeu. Verifique o IP, a porta e se o dispositivo está ligado e na mesma rede.'
      );
      if (isHttps) setShowGuide(true);
      return;
    }

    saveHistory(trimmed, hit.kind);
    setHistory(loadHistory());
    onConnect(hit.url, hit.kind);
  }, [ip, onConnect]);

  const handleScan = useCallback(async () => {
    const s = subnet.trim();
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)) {
      setError('Sub-rede inválida. Ex: 192.168.1');
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setScanning(true);
    setScanProgress(0);
    setScanFound([]);
    setError(null);

    await scanSubnet(
      s,
      ctrl.signal,
      (done, total) => setScanProgress(Math.round((done / total) * 100)),
      (foundIp, hit) => setScanFound(prev => {
        if (prev.some(p => p.ip === foundIp)) return prev;
        return [...prev, { ip: foundIp, hit }];
      }),
    );

    if (!ctrl.signal.aborted) {
      setScanning(false);
      setScanProgress(100);
    }
  }, [subnet]);

  const handleScanConnect = useCallback((foundIp: string, hit: ProbeHit) => {
    setIp(foundIp);
    saveHistory(foundIp, hit.kind);
    setHistory(loadHistory());
    onConnect(hit.url, hit.kind);
  }, [onConnect]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setTesting(false);
    setScanning(false);
    setProbeInfo(null);
  }, []);

  const busy = testing || scanning;

  return (
    <div className="space-y-4 p-4 bg-slate-900/30 rounded-xl border border-slate-800">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">📡</span>
        <span className="text-sm font-bold">Dispositivo WiFi</span>
        {connected && (
          <span className="ml-auto text-[10px] uppercase font-bold px-2 py-1 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
            Conectado
          </span>
        )}
      </div>

      {/* Manual connect */}
      <div className="flex gap-2">
        <input
          type="text"
          value={ip}
          onChange={e => setIp(e.target.value)}
          placeholder="192.168.1.100 ou 192.168.1.100:8080"
          disabled={connected || busy}
          onKeyDown={e => { if (e.key === 'Enter' && !busy) handleConnect(); }}
          className="flex-1 bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-60"
        />
        {connected ? (
          <button
            onClick={() => { onDisconnect(); setError(null); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors"
          >
            Desconectar
          </button>
        ) : (
          <button
            onClick={busy ? handleCancel : handleConnect}
            disabled={!busy && !ip.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              busy
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                : 'gold-gradient text-white disabled:opacity-50'
            }`}
          >
            {testing ? 'Cancelar' : scanning ? 'Parar' : 'Conectar'}
          </button>
        )}
      </div>

      {/* Probe status */}
      {testing && probeInfo && (
        <p className="text-[11px] text-amber-200 flex items-center gap-2">
          <span className="w-3 h-3 border border-amber-300 border-t-transparent rounded-full animate-spin" />
          Testando <code className="text-amber-100">{probeInfo}</code>
        </p>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Info line */}
      {!error && !connected && !busy && (
        <p className="text-[11px] text-slate-500">
          Testa portas {COMMON_PORTS.join(', ')} com {MJPEG_PATHS.length + SNAPSHOT_PATHS.length} caminhos
          (MJPEG + snapshot). Aceita IP, IP:porta ou URL completa.
        </p>
      )}

      {/* Network scan */}
      {!connected && (
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <span>🔍</span> Escanear rede local
          </p>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500 shrink-0">Sub-rede:</span>
            <input
              type="text"
              value={subnet}
              onChange={e => setSubnet(e.target.value)}
              placeholder="192.168.1"
              disabled={busy}
              className="flex-1 bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 disabled:opacity-60"
            />
            <button
              onClick={scanning ? handleCancel : handleScan}
              disabled={testing}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scanning
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-200 disabled:opacity-50'
              }`}
            >
              {scanning ? 'Parar' : 'Escanear'}
            </button>
          </div>

          {scanning && (
            <div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{scanProgress}% — escaneando {subnet}.*</p>
            </div>
          )}

          {scanFound.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-emerald-400 font-bold uppercase">
                Dispositivos encontrados:
              </p>
              {scanFound.map(({ ip: foundIp, hit }) => (
                <button
                  key={foundIp}
                  onClick={() => handleScanConnect(foundIp, hit)}
                  className="w-full flex items-center justify-between p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors text-left"
                >
                  <span className="text-sm text-emerald-200">{foundIp}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-bold">
                    {hit.kind}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!scanning && scanProgress === 100 && scanFound.length === 0 && (
            <p className="text-xs text-slate-500">
              Nenhum dispositivo encontrado na sub-rede {subnet}.*.
              {isSecure() && ' Em HTTPS, o navegador pode bloquear detecção direta — veja o guia abaixo.'}
            </p>
          )}
        </div>
      )}

      {/* Saved devices */}
      {!connected && history.length > 0 && (
        <div className="border-t border-slate-800 pt-3 space-y-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Dispositivos recentes</p>
          {history.map(d => (
            <button
              key={d.ip}
              onClick={() => { setIp(d.ip); }}
              disabled={busy}
              className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-amber-200 hover:bg-slate-800/50 transition-colors disabled:opacity-50 flex justify-between"
            >
              <span>{d.ip}</span>
              <span className="text-slate-600 text-[10px]">
                {new Date(d.lastUsed).toLocaleDateString('pt-BR')}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* HTTPS / Mixed Content guide */}
      {isSecure() && !connected && (
        <div className="border-t border-slate-800 pt-3">
          <button
            onClick={() => setShowGuide(g => !g)}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
          >
            <span>{showGuide ? '▾' : '▸'}</span>
            {showGuide ? 'Ocultar guia HTTPS' : '⚠ Problemas com conexão? Guia HTTPS'}
          </button>

          {showGuide && (
            <div className="mt-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-2 text-xs text-slate-300">
              <p className="font-bold text-amber-300">
                Por que o scanner WiFi não conecta em HTTPS?
              </p>
              <p>
                Este site é servido via HTTPS, mas scanners/microscópios WiFi usam HTTP.
                O navegador bloqueia essa mistura por segurança (Mixed Content).
              </p>
              <p className="font-bold text-amber-200 mt-2">Solução para Chrome/Edge:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Clique no <strong className="text-slate-200">ícone de cadeado</strong> (ou &quot;Tune&quot;) na barra de endereço</li>
                <li>Selecione <strong className="text-slate-200">Configurações do site</strong></li>
                <li>Procure <strong className="text-slate-200">Conteúdo inseguro</strong> (ou &quot;Insecure content&quot;)</li>
                <li>Mude para <strong className="text-slate-200">Permitir</strong></li>
                <li>Recarregue a página e tente conectar novamente</li>
              </ol>
              <p className="font-bold text-amber-200 mt-2">Solução para Firefox:</p>
              <p className="text-slate-400">
                Firefox geralmente permite imagens HTTP em páginas HTTPS.
                Se não funcionar, clique no cadeado → desative a proteção para este site.
              </p>
              <p className="font-bold text-amber-200 mt-2">Dica geral:</p>
              <p className="text-slate-400">
                Certifique-se de que o celular/computador está na <strong className="text-slate-200">mesma rede WiFi</strong> do scanner.
                O IP do scanner normalmente aparece no app do microscópio ou nas configurações do dispositivo.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
