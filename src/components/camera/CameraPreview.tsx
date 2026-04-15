import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export interface CameraPreviewHandle {
  /**
   * Captures the current frame as a JPEG Blob (quality 0.92).
   * Throws if there's no active stream/wifi source or if the source is
   * cross-origin tainted (in which case it must be routed through
   * `/api/proxy-stream`).
   */
  captureFrame: () => Promise<Blob>;
}

export interface CameraPreviewProps {
  stream: MediaStream | null;
  wifiUrl: string | null;
  onReady?: () => void;
}

const JPEG_QUALITY = 0.92;

const CameraPreview = forwardRef<CameraPreviewHandle, CameraPreviewProps>(
  function CameraPreview({ stream, wifiUrl, onReady }, ref) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);

    // Bind / unbind the MediaStream to the <video> element imperatively
    // (React doesn't have a built-in `srcObject` prop).
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (stream) {
        setLoading(true);
        setErrMsg(null);
        video.srcObject = stream;
      } else {
        video.srcObject = null;
      }
    }, [stream]);

    useEffect(() => {
      if (wifiUrl) {
        setLoading(true);
        setErrMsg(null);
      }
    }, [wifiUrl]);

    useImperativeHandle(
      ref,
      () => ({
        captureFrame: async () => {
          let source: CanvasImageSource;
          let width = 0;
          let height = 0;

          if (stream && videoRef.current) {
            const v = videoRef.current;
            width = v.videoWidth || v.clientWidth;
            height = v.videoHeight || v.clientHeight;
            source = v;
          } else if (wifiUrl && imgRef.current) {
            const img = imgRef.current;
            width = img.naturalWidth || img.clientWidth;
            height = img.naturalHeight || img.clientHeight;
            source = img;
          } else {
            throw new Error('Sem fonte de vídeo ativa para captura.');
          }

          if (!width || !height) {
            throw new Error('Frame ainda não está pronto. Aguarde o vídeo carregar.');
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D não disponível neste navegador.');

          try {
            ctx.drawImage(source, 0, 0, width, height);
          } catch {
            throw new Error('Falha ao desenhar frame (origem possivelmente bloqueada por CORS).');
          }

          return new Promise<Blob>((resolve, reject) => {
            try {
              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else reject(new Error('Falha ao gerar JPEG do frame.'));
                },
                'image/jpeg',
                JPEG_QUALITY
              );
            } catch (err) {
              // SecurityError when the canvas is tainted (cross-origin image).
              reject(
                new Error(
                  'Canvas tainted por origem cruzada — use /api/proxy-stream para WiFi.'
                )
              );
            }
          });
        },
      }),
      [stream, wifiUrl]
    );

    const isEmpty = !stream && !wifiUrl;

    return (
      <div className="relative w-full aspect-video glass rounded-xl overflow-hidden flex items-center justify-center">
        {/* Stream (MediaStream) */}
        {stream && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain bg-black"
            onCanPlay={() => {
              setLoading(false);
              onReady?.();
            }}
            onError={() => {
              setLoading(false);
              setErrMsg('Erro ao reproduzir o vídeo.');
            }}
          />
        )}

        {/* WiFi MJPEG */}
        {!stream && wifiUrl && (
          <img
            ref={imgRef}
            src={wifiUrl}
            alt="preview WiFi"
            className="w-full h-full object-contain bg-black"
            onLoad={() => {
              setLoading(false);
              onReady?.();
            }}
            onError={() => {
              setLoading(false);
              setErrMsg('Não foi possível carregar o stream WiFi.');
            }}
          />
        )}

        {/* Empty placeholder */}
        {isEmpty && !errMsg && (
          <div className="text-slate-400 text-sm text-center px-6">
            <span className="text-4xl block mb-2">📷</span>
            Nenhuma câmera selecionada
          </div>
        )}

        {/* Loading overlay */}
        {loading && !errMsg && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
              <span className="text-amber-200 text-sm">Carregando...</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {errMsg && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 text-center px-6">
            <div>
              <span className="text-3xl block mb-2">⚠️</span>
              <p className="text-red-200 text-sm">{errMsg}</p>
            </div>
          </div>
        )}

        {/* Scanner accent — only when actively previewing */}
        {(stream || wifiUrl) && !loading && !errMsg && <div className="scanner-line" />}
      </div>
    );
  }
);

export default CameraPreview;
