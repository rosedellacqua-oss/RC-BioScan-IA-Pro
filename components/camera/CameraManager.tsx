import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCamera } from '../../hooks/useCamera';
import {
  hasMediaDevicesSupport,
  isMobileUserAgent,
  useDeviceDetection,
  type DeviceKind,
} from '../../hooks/useDeviceDetection';
import { useUpload } from '../../hooks/useUpload';
import { CameraPreview, type CameraPreviewHandle } from './CameraPreview';
import { CaptureButton } from './CaptureButton';
import { DeviceSelector, WIFI_DEVICE_ID } from './DeviceSelector';
import { WifiDeviceInput } from './WifiDeviceInput';

export interface CapturedFrame {
  blob: Blob;
  base64: string;
  deviceType: DeviceKind;
  timestamp: string;
  uploadedUrl?: string;
  uploadedId?: string;
}

export interface CameraManagerProps {
  onCapture: (frame: CapturedFrame) => void;
  autoUpload?: boolean;
  uploadEndpoint?: string;
  className?: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export const CameraManager: React.FC<CameraManagerProps> = ({
  onCapture,
  autoUpload = true,
  uploadEndpoint = '/api/upload',
  className = '',
}) => {
  const isMobile = useMemo(() => isMobileUserAgent(), []);
  const [supported] = useState<boolean>(() => hasMediaDevicesSupport());
  const {
    devices,
    stream,
    activeDeviceId,
    permission,
    error: cameraError,
    loading: cameraLoading,
    requestPermission,
    refreshDevices,
    startStream,
    stopStream,
  } = useCamera();

  const classified = useDeviceDetection(devices, isMobile);
  const { status: uploadStatus, error: uploadError, upload, reset: resetUpload } =
    useUpload(uploadEndpoint);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wifiUrl, setWifiUrl] = useState<string | null>(null);
  const [captureMsg, setCaptureMsg] = useState<string | null>(null);
  const previewRef = useRef<CameraPreviewHandle | null>(null);

  // Request permission on mount (needed so labels are populated)
  useEffect(() => {
    if (!supported) return;
    (async () => {
      await requestPermission();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select single device when list settles
  useEffect(() => {
    if (selectedId || wifiUrl) return;
    if (classified.length === 1) {
      setSelectedId(classified[0].deviceId);
    }
  }, [classified, selectedId, wifiUrl]);

  // Start stream whenever a classified device is selected
  useEffect(() => {
    if (!selectedId || selectedId === WIFI_DEVICE_ID) return;
    const picked = classified.find((d) => d.deviceId === selectedId);
    const facing =
      picked?.kind === 'mobile_front'
        ? 'user'
        : picked?.kind === 'mobile_back'
          ? 'environment'
          : undefined;
    startStream(selectedId, facing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleSelect = useCallback(
    (id: string) => {
      resetUpload();
      setCaptureMsg(null);
      if (id === WIFI_DEVICE_ID) {
        stopStream();
        setSelectedId(WIFI_DEVICE_ID);
        return;
      }
      // Switching to a MediaDevices source
      setWifiUrl(null);
      setSelectedId(id);
    },
    [resetUpload, stopStream]
  );

  const handleWifiConnect = useCallback(
    (url: string) => {
      stopStream();
      setWifiUrl(url);
      setSelectedId(WIFI_DEVICE_ID);
    },
    [stopStream]
  );

  const handleWifiDisconnect = useCallback(() => {
    setWifiUrl(null);
    if (selectedId === WIFI_DEVICE_ID) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const activeKind: DeviceKind = useMemo(() => {
    if (selectedId === WIFI_DEVICE_ID) return 'wifi_microscope';
    const picked = classified.find((d) => d.deviceId === selectedId);
    return picked?.kind || 'unknown';
  }, [classified, selectedId]);

  const previewMode = selectedId === WIFI_DEVICE_ID ? 'mjpeg' : 'stream';
  const mirrored = activeKind === 'mobile_front';
  const hasActiveSource =
    (previewMode === 'stream' && !!stream) || (previewMode === 'mjpeg' && !!wifiUrl);

  const handleCapture = async () => {
    setCaptureMsg(null);
    resetUpload();
    const blob = await previewRef.current?.captureFrame(0.92);
    if (!blob) {
      setCaptureMsg('Não foi possível capturar o frame. Aguarde o preview carregar.');
      return;
    }
    const base64 = await blobToBase64(blob);
    const timestamp = new Date().toISOString();

    let uploadedUrl: string | undefined;
    let uploadedId: string | undefined;

    if (autoUpload) {
      const res = await upload(blob, activeKind);
      if (res?.success) {
        uploadedUrl = res.imageUrl;
        uploadedId = res.id;
      }
    }

    onCapture({
      blob,
      base64,
      deviceType: activeKind,
      timestamp,
      uploadedUrl,
      uploadedId,
    });

    setCaptureMsg(autoUpload ? 'Imagem capturada e enviada!' : 'Imagem capturada!');
  };

  if (!supported) {
    return (
      <div className={`glass rounded-2xl p-6 border border-white/5 ${className}`}>
        <p className="text-slate-400 text-sm">
          Seu navegador não suporta captura de câmera (MediaDevices API).
          Use um navegador moderno ou faça upload manual das imagens.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Permission gate */}
      {permission === 'denied' && (
        <div className="glass rounded-2xl p-5 border border-red-500/30 space-y-3">
          <p className="text-sm text-red-300 font-bold">
            Permissão de câmera negada.
          </p>
          <p className="text-xs text-slate-400">
            Habilite o acesso à câmera nas configurações do navegador e
            recarregue a página. Você ainda pode conectar um dispositivo WiFi
            abaixo.
          </p>
          <button
            onClick={() => requestPermission()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Device selection */}
      {(classified.length > 0 || permission === 'granted') && (
        <DeviceSelector
          devices={classified}
          activeDeviceId={selectedId}
          onSelect={handleSelect}
          includeWifiOption={true}
        />
      )}

      {classified.length === 0 && permission === 'granted' && !wifiUrl && (
        <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-800 text-sm text-slate-400 flex items-center justify-between gap-3">
          <span>Nenhum dispositivo de vídeo detectado.</span>
          <button
            onClick={() => refreshDevices()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold"
          >
            Atualizar lista
          </button>
        </div>
      )}

      {/* WiFi input (shown when the WiFi option is chosen OR there are no devices at all) */}
      {(selectedId === WIFI_DEVICE_ID || (!classified.length && permission !== 'denied')) && (
        <WifiDeviceInput
          onConnect={handleWifiConnect}
          onDisconnect={handleWifiDisconnect}
          connected={!!wifiUrl}
        />
      )}

      {/* Preview */}
      {hasActiveSource && (
        <CameraPreview
          ref={previewRef}
          mode={previewMode}
          stream={stream}
          mjpegUrl={wifiUrl}
          mirrored={mirrored}
          className="aspect-video border border-slate-800"
          onError={(m) => setCaptureMsg(m)}
        />
      )}

      {/* Capture action */}
      {hasActiveSource && (
        <CaptureButton
          onCapture={handleCapture}
          disabled={cameraLoading}
          loading={uploadStatus === 'uploading'}
        />
      )}

      {/* Status messages */}
      {cameraError && (
        <p className="text-xs text-red-400">Erro da câmera: {cameraError}</p>
      )}
      {uploadError && uploadStatus === 'error' && (
        <p className="text-xs text-red-400">Falha no upload: {uploadError}</p>
      )}
      {captureMsg && uploadStatus !== 'error' && (
        <p className="text-xs text-emerald-400">{captureMsg}</p>
      )}
    </div>
  );
};

export default CameraManager;
