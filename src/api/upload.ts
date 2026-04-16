export interface UploadMetadata {
  deviceType: string;
  timestamp: number;
}

export interface UploadResponse {
  success: boolean;
  imageUrl: string;
  id: string;
}

export type UploadProgressFn = (percent: number) => void;

const ENDPOINT = '/api/upload';

/**
 * Sends a captured image to the backend via multipart/form-data.
 *
 * Implemented with XMLHttpRequest (and not `fetch`) because browsers do not
 * expose request-body upload progress on `fetch`. The optional `onProgress`
 * callback receives values in the 0–100 range.
 */
export async function uploadImage(
  file: File,
  metadata: UploadMetadata,
  onProgress?: UploadProgressFn
): Promise<UploadResponse> {
  return new Promise<UploadResponse>((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('metadata', JSON.stringify(metadata));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', ENDPOINT);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (ev: ProgressEvent) => {
        if (ev.lengthComputable && ev.total > 0) {
          onProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
    }

    xhr.onerror = () => reject(new Error('Falha de rede ao enviar imagem.'));
    xhr.onabort = () => reject(new Error('Upload cancelado.'));
    xhr.ontimeout = () => reject(new Error('Tempo esgotado ao enviar imagem.'));

    xhr.onload = () => {
      let payload: Partial<UploadResponse> | null = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        reject(new Error('Resposta inválida do servidor de upload.'));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Upload falhou (HTTP ${xhr.status}).`));
        return;
      }

      if (
        !payload ||
        payload.success !== true ||
        typeof payload.imageUrl !== 'string' ||
        typeof payload.id !== 'string'
      ) {
        reject(new Error('Resposta de upload em formato inesperado.'));
        return;
      }

      resolve(payload as UploadResponse);
    };

    xhr.send(fd);
  });
}
