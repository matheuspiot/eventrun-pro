"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { BaseModal } from "@/components/base-modal";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
};

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type ConfirmState = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
} | null;

type UiFeedbackContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const UiFeedbackContext = createContext<UiFeedbackContextValue | null>(null);

function toneClasses(tone: ToastTone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "error":
      return "border-red-200 bg-red-50 text-red-900";
    default:
      return "border-slate-200 bg-white text-slate-900";
  }
}

export function UiFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const value = useMemo<UiFeedbackContextValue>(
    () => ({
      showToast(toast) {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((current) => [...current, { id, ...toast }]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((item) => item.id !== id));
        }, 4200);
      },
      confirm(options) {
        return new Promise<boolean>((resolve) => {
          setConfirmState({ options, resolve });
        });
      },
    }),
    [],
  );

  return (
    <UiFeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_18px_44px_rgba(15,23,42,0.14)] ${toneClasses(
              toast.tone,
            )}`}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message ? <p className="mt-1 text-sm opacity-80">{toast.message}</p> : null}
          </div>
        ))}
      </div>

      <BaseModal
        open={Boolean(confirmState)}
        onClose={() => {
          confirmState?.resolve(false);
          setConfirmState(null);
        }}
        title={confirmState?.options.title ?? ""}
        description={confirmState?.options.description}
      >
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              confirmState?.resolve(false);
              setConfirmState(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {confirmState?.options.cancelLabel ?? "Cancelar"}
          </button>
          <button
            type="button"
            onClick={() => {
              confirmState?.resolve(true);
              setConfirmState(null);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              confirmState?.options.tone === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {confirmState?.options.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </BaseModal>
    </UiFeedbackContext.Provider>
  );
}

export function useUiFeedback() {
  const context = useContext(UiFeedbackContext);

  if (!context) {
    throw new Error("useUiFeedback must be used within UiFeedbackProvider");
  }

  return context;
}
