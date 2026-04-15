import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type PreviewMode = 'stream' | 'mjpeg';

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
        video.play().catch(() => {
          /* autoplay can fail on some browsers; user gesture may be required */
        });
      } else {
        video.srcObject = null;
      }
    }, [mode, stream]);

    useImperativeHandle(
      ref,
      () => ({
        captureFrame: async (quality: number = 0.92): Promise<Blob | null> => {
          try {
            const canvas = document.createElement('canvas');
            let sourceWidth = 0;
            let sourceHeight = 0;

            if (mode === 'stream') {
              const video = videoRef.current;
              if (!video || video.readyState < 2) return null;
              sourceWidth = video.videoWidth;
              sourceHeight = video.videoHeight;
              canvas.width = sourceWidth;
              canvas.height = sourceHeight;
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
              sourceWidth = img.naturalWidth;
              sourceHeight = img.naturalHeight;
              canvas.width = sourceWidth;
              canvas.height = sourceHeight;
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
        ) : (
          <img
            ref={imgRef}
            src={mjpegUrl || ''}
            alt="MJPEG Stream"
            crossOrigin="anonymous"
            onError={() =>
              onError?.('Falha ao carregar o stream MJPEG. Verifique o IP e o caminho.')
            }
            className="w-full h-full object-contain"
          />
        )}
        {/* Scanner line overlay for the "bio-scanner" feel */}
        <div className="scanner-line pointer-events-none"></div>
      </div>
    );
  }
);
