import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'rc-bioscan:wifi-camera-ip';
const TEST_PATHS = ['/stream', '/video', '/mjpeg', '/videostream', '/mjpg/video.mjpg'];

export interface WifiDeviceInputProps {
  onConnect: (url: string) => void;
  onDisconnect: () => void;
  connected: boolean;
  useProxy?: boolean;
}

function buildCandidateUrls(ip: string, useProxy: boolean): string[] {
  // Normalize IP: strip protocol if user included one
  const clean = ip.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const base = `http://${clean}`;
  return TEST_PATHS.map((p) => {
    const direct = `${base}${p}`;
    return useProxy
      ? `/api/proxy-stream?url=${encodeURIComponent(direct)}`
      : direct;
  });
}

function isValidIpOrHost(value: string): boolean {
  const trimmed = value.trim().replace(/^https?:\/\//, '').split('/')[0];
  if (!trimmed) return false;
  // Accept IPv4 with optional :port, or bare host
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}(:\d{1,5})?$/;
  const host = /^[a-zA-Z0-9.-]+(:\d{1,5})?$/;
  return ipv4.test(trimmed) || host.test(trimmed);
}

export const WifiDeviceInput: React.FC<WifiDeviceInputProps> = ({
  onConnect,
  onDisconnect,
  connected,
  useProxy = true,
}) => {
  const [ip, setIp] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last) setIp(last);
    } catch {
      /* localStorage may be disabled */
    }
  }, []);

  const testUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = window.setTimeout(() => {
        img.src = '';
        resolve(false);
      }, 2500);
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      // MJPEG streams often "load" the first frame as an image.
      img.src = url;
    });
  };

  const handleConnect = async () => {
    setError(null);
    if (!isValidIpOrHost(ip)) {
      setError('IP inválido. Ex: 192.168.1.42 ou 192.168.1.42:8080');
      return;
    }
    setTesting(true);
    try {
      const candidates = buildCandidateUrls(ip, useProxy);
      let working: string | null = null;
      for (const url of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await testUrl(url);
        if (ok) {
          working = url;
          break;
        }
      }
      if (!working) {
        setError(
          'Não foi possível conectar. Verifique o IP, a rede e o caminho do stream.'
        );
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, ip.trim());
      } catch {
        /* ignore */
      }
      onConnect(working);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-slate-900/30 rounded-xl border border-slate-800">
      <div className="flex items-center gap-2">
        <span className="text-xl">📡</span>
        <span className="text-sm font-bold">Dispositivo WiFi</span>
        {connected && (
          <span className="ml-auto text-[10px] uppercase font-bold px-2 py-1 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
            Conectado
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="192.168.x.x"
          disabled={connected || testing}
          className="flex-1 bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-60"
        />
        {connected ? (
          <button
            onClick={() => {
              onDisconnect();
              setError(null);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors"
          >
            Desconectar
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={testing || !ip}
            className="px-4 py-2 gold-gradient rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-all"
          >
            {testing ? 'Testando…' : 'Conectar'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!error && !connected && (
        <p className="text-[11px] text-slate-500">
          Suporta streams MJPEG. Caminhos testados: {TEST_PATHS.join(', ')}.
        </p>
      )}
    </div>
  );
};
