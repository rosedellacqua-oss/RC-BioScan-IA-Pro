import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type PreviewMode = 'stream' | 'mjpeg' | 'snapshot';

export interface CameraPreviewProps {
  mode: PreviewMode;
  stream?: MediaStream | null;
  mjpegUrl?: string | null;
  className?: string;
  mirrored?: boolean;
  onError?: (msg: string) => void;
}

export interface CameraPreviewHandle {
  captureFrame: (quality?: number) => Promise<Blob | null>;
}

const SNAPSHOT_REFRESH_MS = 500;

export const CameraPreview = forwardRef<CameraPreviewHandle, CameraPreviewProps>(
  function CameraPreview(
    { mode, stream, mjpegUrl, className = '', mirrored = false, onError },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    // Bind MediaStream to <video>
    useEffect(() => {
      const video = videoRef.current;
      if (mode !== 'stream' || !video) return;
      if (stream) {
        video.srcObject = stream;
        video.play().catch(() => {});
      } else {
        video.srcObject = null;
      }
    }, [mode, stream]);

    // Snapshot auto-refresh: reload the image every SNAPSHOT_REFRESH_MS
    useEffect(() => {
      if (mode !== 'snapshot' || !mjpegUrl) return;
      const img = imgRef.current;
      if (!img) return;

      const baseUrl = mjpegUrl.replace(/[?&]_t=\d+$/, '');

      const interval = setInterval(() => {
        const sep = baseUrl.includes('?') ? '&' : '?';
        img.src = `${baseUrl}${sep}_t=${Date.now()}`;
      }, SNAPSHOT_REFRESH_MS);

      return () => clearInterval(interval);
    }, [mode, mjpegUrl]);

    useImperativeHandle(
      ref,
      () => ({
        captureFrame: async (quality: number = 0.92): Promise<Blob | null> => {
          try {
            const canvas = document.createElement('canvas');

            if (mode === 'stream') {
              const video = videoRef.current;
              if (!video || video.readyState < 2) return null;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) return null;
              if (mirrored) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
              }
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            } else {
              const img = imgRef.current;
              if (!img || !img.complete || !img.naturalWidth) return null;
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) return null;
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }

            return await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
            });
          } catch (e: any) {
            onError?.(e?.message || 'Erro ao capturar frame');
            return null;
          }
        },
      }),
      [mode, mirrored, onError]
    );

    const showImg = mode === 'mjpeg' || mode === 'snapshot';

    return (
      <div className={`relative overflow-hidden rounded-2xl bg-black ${className}`}>
        {mode === 'stream' ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
            style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
          />
        ) : showImg ? (
          <img
            ref={imgRef}
            src={mjpegUrl || ''}
            alt={mode === 'snapshot' ? 'Snapshot' : 'MJPEG Stream'}
            crossOrigin="anonymous"
            onError={() =>
              onError?.('Falha ao carregar o stream. Verifique o IP e as configurações de rede.')
            }
            className="w-full h-full object-contain"
          />
        ) : null}
        <div className="scanner-line pointer-events-none" />
      </div>
    );
  }
);
