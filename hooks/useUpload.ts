import { useCallback, useState } from 'react';
import type { DeviceKind } from './useDeviceDetection';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadResponse {
  success: boolean;
  imageUrl?: string;
  id?: string;
  error?: string;
}

export interface UseUploadResult {
  status: UploadStatus;
  error: string | null;
  response: UploadResponse | null;
  upload: (blob: Blob, deviceType: DeviceKind) => Promise<UploadResponse | null>;
  reset: () => void;
}

export function useUpload(endpoint: string = '/api/upload'): UseUploadResult {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<UploadResponse | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResponse(null);
  }, []);

  const upload = useCallback(
    async (blob: Blob, deviceType: DeviceKind): Promise<UploadResponse | null> => {
      setStatus('uploading');
      setError(null);
      setResponse(null);

      try {
        const form = new FormData();
        form.append('file', blob, `capture-${Date.now()}.jpg`);
        form.append('deviceType', deviceType);
        form.append('timestamp', new Date().toISOString());

        const res = await fetch(endpoint, {
          method: 'POST',
          body: form,
        });

        const data = (await res.json().catch(() => ({}))) as UploadResponse;

        if (!res.ok || !data.success) {
          const msg = data?.error || `Falha no upload (HTTP ${res.status})`;
          setStatus('error');
          setError(msg);
          return null;
        }

        setStatus('success');
        setResponse(data);
        return data;
      } catch (e: any) {
        const msg = e?.message || 'Erro de rede no upload';
        setStatus('error');
        setError(msg);
        return null;
      }
    },
    [endpoint]
  );

  return { status, error, response, upload, reset };
}
