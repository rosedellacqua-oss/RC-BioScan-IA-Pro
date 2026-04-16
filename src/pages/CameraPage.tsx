import CameraManager from '../components/camera';

/**
 * Standalone page for the Universal Camera Integration feature.
 *
 * Rendered by App.tsx when `window.location.hash === '#/camera'`. The rest of
 * the app keeps its linear anamnese→report state machine unchanged; this page
 * is a self-contained capture surface that can later be embedded in the main
 * flow (e.g. as an alternative to the IMAGES step) without rework.
 */
export default function CameraPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="p-6 border-b border-yellow-500/20 glass sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">📷</span>
            <h1 className="text-2xl font-bold gold-text">Captura de Imagem</h1>
          </div>
          <a
            href="#/"
            className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-4"
          >
            ← Voltar
          </a>
        </div>
      </header>

      <section className="py-8">
        <CameraManager />
      </section>
    </main>
  );
}
