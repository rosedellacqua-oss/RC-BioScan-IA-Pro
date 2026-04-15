import { useEffect, useMemo, useRef, useState } from 'react';
import { useCamera } from '../../hooks/useCamera';
import {
  useDeviceDetection,
  type ClassifiedDevice,
} from '../../hooks/useDeviceDetection';
import { useUpload } from '../../hooks/useUpload';
import CameraPreview, { type CameraPreviewHandle } from './CameraPreview';
import DeviceSelector, { type ConnectionBadge } from './DeviceSelector';
import WifiDeviceInput from './WifiDeviceInput';
import CaptureButton from './CaptureButton';

const WIFI_ID = 'wifi';

function badgeFor(
  device: ClassifiedDevice | undefined,
  hasWifiActive: boolean
): ConnectionBadge {
  if (hasWifiActive) return 'WiFi';
  if (!device) return null;
  switch (device.tipo) {
    case 'usb_microscope':
    case 'webcam':
      return 'USB';
    case 'mobile_back':
    case 'mobile_front':
      return 'Nativo';
    default:
      return null;
  }
}

/**
 * High-level orchestrator:
 *  1. Requests camera permission on mount.
 *  2. Lets the user choose between detected devices (or the WiFi sentinel).
 *  3. Renders the live preview and the capture button.
 *  4. On capture: snapshots a JPEG frame, uploads it, shows a thumbnail.
 */
export default function CameraManager() {
  const camera = useCamera();
  const detection = useDeviceDetection(camera.devices);
  const uploader = useUpload();

  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [wifiUrl, setWifiUrl] = useState<string | null>(null);
  const [capturedThumb, setCapturedThumb] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const previewRef = useRef<CameraPreviewHandle>(null);

  // 1. Ask for permission once on mount.
  useEffect(() => {
    camera.requestPermission();
    // We intentionally run this only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Auto-select the first real (non-wifi) device after enumeration.
  useEffect(() => {
    if (activeDeviceId) return;
    const first = detection.classifiedDevices.find((d) => d.tipo !== 'wifi');
    if (first) setActiveDeviceId(first.deviceId);
  }, [detection.classifiedDevices, activeDeviceId]);

  // 3. Drive the camera based on the current selection.
  useEffect(() => {
    if (!activeDeviceId) return;
    if (activeDeviceId === WIFI_ID) {
      camera.stopCamera();
      return;
    }
    setWifiUrl(null);
    camera.selectDevice(activeDeviceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeviceId]);

  // 4. Revoke the previous thumbnail object URL when it changes / unmounts.
  useEffect(() => {
    return () => {
      if (capturedThumb) URL.revokeObjectURL(capturedThumb);
    };
  }, [capturedThumb]);

  function handleSelect(deviceId: string) {
    setActiveDeviceId(deviceId);
    setCaptureError(null);
    uploader.reset();
    if (deviceId !== WIFI_ID) setWifiUrl(null);
  }

  function handleWifiConnect(url: string) {
    camera.stopCamera();
    setWifiUrl(url);
  }

  async function handleCapture(): Promise<void> {
    setCaptureError(null);
    if (!previewRef.current) return;

    let blob: Blob;
    try {
      blob = await previewRef.current.captureFrame();
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Falha ao capturar.');
      return;
    }

    if (capturedThumb) URL.revokeObjectURL(capturedThumb);
    setCapturedThumb(URL.createObjectURL(blob));

    const activeDevice = detection.classifiedDevices.find(
      (d) => d.deviceId === activeDeviceId
    );
    await uploader.upload(blob, {
      deviceType: activeDevice?.tipo ?? 'webcam',
      timestamp: Date.now(),
    });
  }

  const activeDevice = useMemo(
    () => detection.classifiedDevices.find((d) => d.deviceId === activeDeviceId),
    [detection.classifiedDevices, activeDeviceId]
  );

  const wifiActive = activeDeviceId === WIFI_ID && !!wifiUrl;
  const badge = badgeFor(activeDevice, wifiActive);
  const errorMsg = captureError || camera.error || uploader.error;
  const captureDisabled =
    camera.isLoading ||
    (activeDeviceId !== WIFI_ID && !camera.activeStream) ||
    (activeDeviceId === WIFI_ID && !wifiUrl);

  return (
    <div className="space-y-4 max-w-3xl mx-auto p-4">
      {camera.permissionStatus === 'denied' && (
        <div className="glass rounded-xl p-4 border border-red-500/30">
          <p className="text-sm text-red-300">
            Permissão de câmera negada. Habilite o acesso nas configurações do
            navegador e clique em <strong>Tentar novamente</strong>.
          </p>
          <button
            type="button"
            onClick={() => camera.requestPermission()}
            className="mt-3 gold-gradient px-4 py-2 rounded-xl text-slate-900 font-semibold text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <DeviceSelector
        classifiedDevices={detection.classifiedDevices}
        selectedDeviceId={activeDeviceId}
        onChange={handleSelect}
        connectionBadge={badge}
      />

      {activeDeviceId === WIFI_ID && (
        <WifiDeviceInput onConnect={handleWifiConnect} />
      )}

      <CameraPreview
        ref={previewRef}
        stream={activeDeviceId !== WIFI_ID ? camera.activeStream : null}
        wifiUrl={activeDeviceId === WIFI_ID ? wifiUrl : null}
      />

      {errorMsg && (
        <div className="glass rounded-xl p-3 border border-red-500/30">
          <p className="text-sm text-red-300">⚠ {errorMsg}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <CaptureButton
          onCapture={handleCapture}
          disabled={captureDisabled}
          isUploading={uploader.isUploading}
        />

        {uploader.isUploading && (
          <div className="flex-1 max-w-xs">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full gold-gradient transition-all"
                style={{ width: `${uploader.progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{uploader.progress}%</p>
          </div>
        )}

        {capturedThumb && !uploader.isUploading && (
          <div className="flex items-center gap-3">
            <img
              src={capturedThumb}
              alt="captura"
              className="w-16 h-16 object-cover rounded-lg border border-amber-400/40"
            />
            {uploader.result && (
              <div className="text-xs text-emerald-300">
                ✓ Enviado
                <br />
                <code className="text-emerald-200 text-[10px]">
                  {uploader.result.id.slice(0, 8)}
                </code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
