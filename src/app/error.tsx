"use client";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          EventRun Pro
        </p>
        <h1 className="mt-2 text-3xl font-heading text-zinc-900">Erro inesperado</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Ocorreu uma falha na interface. Voce pode tentar novamente sem fechar o app.
        </p>
        <p className="mt-4 rounded-lg bg-surface-muted p-3 font-mono text-xs text-zinc-700">
          {error?.message ?? "Erro sem detalhe"}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
