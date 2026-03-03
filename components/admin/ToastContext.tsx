"use client";

import { createContext, useCallback, useContext, useState, useMemo } from "react";

type Toast = { id: number; message: string; type?: "success" | "error" | "info" };

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: number) => void;
} | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastList />
    </ToastContext.Provider>
  );
}

function ToastList() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, removeToast } = ctx;
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`rounded-lg border px-4 py-3 shadow-lg ${
            t.type === "error"
              ? "border-red-700/50 bg-red-900/30 text-red-200"
              : t.type === "success"
                ? "border-amber-700/50 bg-amber-900/30 text-amber-200"
                : "border-amber-800/50 bg-stone-800/90 text-amber-100"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm">{t.message}</p>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-amber-400/80 hover:text-amber-300"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { addToast: () => {}, toasts: [] };
  return ctx;
}
