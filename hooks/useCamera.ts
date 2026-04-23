import { useCallback, useEffect, useRef, useState } from 'react';
import { hasMediaDevicesSupport } from './useDeviceDetection';

export type CameraPermission = 'unknown' | 'granted' | 'denied' | 'prompt';

export interface UseCameraResult {
  devices: MediaDeviceInfo[];
  stream: MediaStream | null;
  activeDeviceId: string | null;
  permission: CameraPermission;
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<boolean>;
  refreshDevices: () => Promise<void>;
  startStream: (deviceId: string, facingMode?: 'user' | 'environment') => Promise<void>;
  stopStream: () => void;
}

export function useCamera(): UseCameraResult {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [permission, setPermission] = useState<CameraPermission>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setActiveDeviceId(null);
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!hasMediaDevicesSupport()) {
      setError('Navegador sem suporte a MediaDevices');
      return;
    }
    try {
      // Force a fresh getUserMedia to trigger USB/OTG permission dialogs,
      // then re-enumerate so new devices show up with labels.
      const temp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      temp.getTracks().forEach((t) => t.stop());
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === 'videoinput'));
      setPermission('granted');
    } catch (e: any) {
      // If getUserMedia fails, still try to enumerate what we can.
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list.filter((d) => d.kind === 'videoinput'));
      } catch {
        setError(e?.message || 'Falha ao listar dispositivos');
      }
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!hasMediaDevicesSupport()) {
      setError('Navegador sem suporte a MediaDevices');
      setPermission('denied');
      return false;
    }
    try {
      // Warm permission by requesting a minimal stream, then stop it immediately.
      const temp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      temp.getTracks().forEach((t) => t.stop());
      setPermission('granted');
      await refreshDevices();
      return true;
    } catch (e: any) {
      const msg = e?.message || 'Permissão negada';
      setPermission('denied');
      setError(msg);
      return false;
    }
  }, [refreshDevices]);

  const startStream = useCallback(
    async (deviceId: string, facingMode?: 'user' | 'environment') => {
      if (!hasMediaDevicesSupport()) {
        setError('Navegador sem suporte a MediaDevices');
        return;
      }
      setLoading(true);
      setError(null);

      // Always stop previous stream before starting a new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: deviceId
            ? {
                deviceId: { exact: deviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                facingMode: facingMode || 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
        };
        const next = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = next;
        setStream(next);
        setActiveDeviceId(deviceId);
        setPermission('granted');
      } catch (e: any) {
        setError(e?.message || 'Falha ao iniciar o stream');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Listen for device changes (hotplug USB camera/microscope)
  useEffect(() => {
    if (!hasMediaDevicesSupport()) return;
    const handler = () => {
      refreshDevices();
    };
    navigator.mediaDevices.addEventListener?.('devicechange', handler);
    return () => {
      navigator.mediaDevices.removeEventListener?.('devicechange', handler);
    };
  }, [refreshDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    devices,
    stream,
    activeDeviceId,
    permission,
    error,
    loading,
    requestPermission,
    refreshDevices,
    startStream,
    stopStream,
  };
}
