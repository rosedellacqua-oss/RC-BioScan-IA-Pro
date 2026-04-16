import { useCallback, useEffect, useRef, useState } from 'react';

export type PermissionStatus = 'pending' | 'granted' | 'denied';

export interface UseCameraResult {
  devices: MediaDeviceInfo[];
  activeStream: MediaStream | null;
  selectedDeviceId: string | null;
  isLoading: boolean;
  error: string | null;
  selectDevice: (deviceId: string) => void;
  stopCamera: () => void;
  requestPermission: () => Promise<void>;
  permissionStatus: PermissionStatus;
}

// Patterns reused locally so this hook stays self-contained (no cross-hook
// import). Keep aligned with useDeviceDetection.
const BACK_PATTERNS = /(back|traseira|environment|rear)/i;
const FRONT_PATTERNS = /(front|frontal|user)/i;

function isMobileEnv(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMediaDevicesAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.enumerateDevices === 'function' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

// Translate the standard MediaDevices error names into a friendly PT-BR message.
function describeError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return 'Erro desconhecido ao acessar a câmera.';
  }
  const e = err as { name?: string; message?: string };
  switch (e.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Permissão de câmera negada. Habilite o acesso nas configurações do navegador.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Dispositivo de câmera não encontrado.';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'Dispositivo selecionado não suporta a configuração solicitada.';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'Câmera ocupada ou em uso por outro aplicativo.';
    default:
      return e.message || 'Falha ao acessar a câmera.';
  }
}

/**
 * Manages camera devices, permissions and the currently active MediaStream.
 *
 * The consumer drives the lifecycle:
 *   1. Call `requestPermission()` to ask the user for access (this also
 *      enumerates devices so labels become populated).
 *   2. Call `selectDevice(deviceId)` to start streaming from a given camera.
 *      The previous stream is stopped before the new one starts.
 *   3. Call `stopCamera()` to release the active stream.
 *
 * On unmount, any active stream is released automatically.
 */
export function useCamera(): UseCameraResult {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('pending');

  const streamRef = useRef<MediaStream | null>(null);
  const isMobileRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Resolve mobile detection once on mount (avoids repeated UA parsing).
  useEffect(() => {
    isMobileRef.current = isMobileEnv();
  }, []);

  // Enumerate videoinput devices. Note: labels will be empty unless the user
  // has already granted permission.
  const enumerate = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    if (!isMediaDevicesAvailable()) {
      if (isMountedRef.current) {
        setError('Navegador sem suporte a MediaDevices.');
      }
      return [];
    }
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = all.filter((d) => d.kind === 'videoinput');
      if (isMountedRef.current) {
        setDevices(videoInputs);
      }
      return videoInputs;
    } catch (err) {
      if (isMountedRef.current) {
        setError(describeError(err));
      }
      return [];
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (isMountedRef.current) {
      setActiveStream(null);
      setSelectedDeviceId(null);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<void> => {
    if (!isMediaDevicesAvailable()) {
      if (isMountedRef.current) {
        setError('Navegador sem suporte a MediaDevices.');
        setPermissionStatus('denied');
      }
      return;
    }
    if (isMountedRef.current) setError(null);
    try {
      // Warm permission so labels become available, then immediately release.
      const tmp = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      tmp.getTracks().forEach((t) => t.stop());
      if (isMountedRef.current) {
        setPermissionStatus('granted');
      }
      await enumerate();
    } catch (err) {
      if (isMountedRef.current) {
        setPermissionStatus('denied');
        setError(describeError(err));
      }
    }
  }, [enumerate]);

  const selectDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      if (!isMediaDevicesAvailable()) {
        if (isMountedRef.current) {
          setError('Navegador sem suporte a MediaDevices.');
        }
        return;
      }

      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      // Always tear down the previous stream first.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // On mobile, hint facingMode based on the label of the chosen device.
      const target = devices.find((d) => d.deviceId === deviceId);
      const labelHint = target?.label || '';
      let facingMode: 'environment' | 'user' | undefined;
      if (isMobileRef.current) {
        if (BACK_PATTERNS.test(labelHint)) facingMode = 'environment';
        else if (FRONT_PATTERNS.test(labelHint)) facingMode = 'user';
      }

      const videoConstraints: MediaTrackConstraints = {
        deviceId: { exact: deviceId },
      };
      if (facingMode) {
        // `ideal` keeps facingMode as a hint and avoids OverconstrainedError
        // when the chosen deviceId already matches a non-conforming device.
        videoConstraints.facingMode = { ideal: facingMode };
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints,
        });

        // If the component unmounted while awaiting, immediately release.
        if (!isMountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setActiveStream(stream);
        setSelectedDeviceId(deviceId);
        setPermissionStatus('granted');
      } catch (err) {
        if (isMountedRef.current) {
          setError(describeError(err));
          setActiveStream(null);
          setSelectedDeviceId(null);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [devices]
  );

  // Lifecycle: keep mounted flag in sync; release stream on unmount.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    devices,
    activeStream,
    selectedDeviceId,
    isLoading,
    error,
    selectDevice,
    stopCamera,
    requestPermission,
    permissionStatus,
  };
}
