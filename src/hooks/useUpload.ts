import { useCallback, useEffect, useRef, useState } from 'react';
import {
  uploadImage,
  type UploadMetadata,
  type UploadResponse,
} from '../api/upload';

export interface UseUploadResult {
  upload: (blob: Blob, metadata: UploadMetadata) => Promise<void>;
  isUploading: boolean;
  /** Upload progress in the 0–100 range. */
  progress: number;
  result: UploadResponse | null;
  error: string | null;
  reset: () => void;
}

const DEFAULT_FILENAME = 'capture.jpg';
const DEFAULT_MIME = 'image/jpeg';

/**
 * Stateful wrapper around `uploadImage` that exposes loading/progress/error
 * to React components. The `upload()` call accepts a raw Blob (e.g. produced
 * by `canvas.toBlob`) and converts it to a `File` with a stable filename
 * before posting it.
 */
export function useUpload(): UseUploadResult {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsUploading(false);
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  const upload = useCallback(
    async (blob: Blob, metadata: UploadMetadata): Promise<void> => {
      if (!isMountedRef.current) return;

      setIsUploading(true);
      setProgress(0);
      setResult(null);
      setError(null);

      // Convert raw Blob → File so the server gets a proper filename + type.
      const file = new File([blob], DEFAULT_FILENAME, {
        type: blob.type || DEFAULT_MIME,
      });

      try {
        const response = await uploadImage(file, metadata, (percent) => {
          if (isMountedRef.current) setProgress(percent);
        });
        if (isMountedRef.current) {
          setResult(response);
          setProgress(100);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(
            err instanceof Error ? err.message : 'Falha ao enviar imagem.'
          );
        }
      } finally {
        if (isMountedRef.current) setIsUploading(false);
      }
    },
    []
  );

  return { upload, isUploading, progress, result, error, reset };
}
