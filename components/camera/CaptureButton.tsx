import React, { useState } from 'react';

export interface CaptureButtonProps {
  onCapture: () => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({
  onCapture,
  disabled = false,
  loading = false,
  label = 'Capturar',
}) => {
  const [shutter, setShutter] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;
    setShutter(true);
    try {
      await onCapture();
    } finally {
      // keep shutter visible briefly for user feedback
      window.setTimeout(() => setShutter(false), 250);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`w-full flex items-center justify-center gap-3 px-6 py-4 gold-gradient rounded-2xl font-bold text-white shadow-xl shadow-orange-500/20 transition-all ${
          disabled || loading
            ? 'opacity-50 grayscale cursor-not-allowed'
            : 'hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            Enviando…
          </>
        ) : (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {label}
          </>
        )}
      </button>
      {shutter && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/80 animate-in fade-in duration-100" />
      )}
    </div>
  );
};
