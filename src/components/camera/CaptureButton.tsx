import { useEffect, useRef, useState } from 'react';

export interface CaptureButtonProps {
  onCapture: () => Promise<void>;
  disabled?: boolean;
  isUploading?: boolean;
}

type Phase = 'idle' | 'busy' | 'done';

const PRESS_MS = 150;
const FLASH_MS = 220;
const DONE_MS = 1800;

export default function CaptureButton({
  onCapture,
  disabled = false,
  isUploading = false,
}: CaptureButtonProps) {
  const [pressed, setPressed] = useState<boolean>(false);
  const [flash, setFlash] = useState<boolean>(false);
  const [phase, setPhase] = useState<Phase>('idle');

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  }

  async function handleClick() {
    if (disabled || isUploading || phase === 'busy') return;

    setPressed(true);
    setFlash(true);
    setPhase('busy');
    schedule(() => setPressed(false), PRESS_MS);
    schedule(() => setFlash(false), FLASH_MS);

    try {
      await onCapture();
      setPhase('done');
      schedule(() => setPhase('idle'), DONE_MS);
    } catch {
      // Error is surfaced by the parent (CameraManager) via uploader.error.
      setPhase('idle');
    }
  }

  const showSpinner = isUploading || phase === 'busy';
  const label =
    phase === 'done' ? '✓ Enviado' : isUploading ? 'Enviando...' : 'Capturar';

  return (
    <div className="relative inline-flex">
      {flash && (
        <span className="absolute inset-0 rounded-full bg-white/70 animate-ping pointer-events-none" />
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || showSpinner}
        className={`relative gold-gradient text-slate-900 font-bold px-8 py-3 rounded-full shadow-lg transition-transform duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
          pressed ? 'scale-95' : 'scale-100'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          {showSpinner && (
            <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          )}
          {label}
        </span>
      </button>
    </div>
  );
}
