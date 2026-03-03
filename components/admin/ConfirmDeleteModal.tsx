"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmDeleteModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" aria-hidden onClick={onCancel} />
      <div className="relative rounded-lg border border-amber-800/50 bg-stone-900 p-6 shadow-xl max-w-md w-full">
        <h3 className="text-lg font-semibold text-amber-200">{title}</h3>
        <p className="mt-2 text-amber-200/80">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn bg-red-700/80 text-white hover:bg-red-600 disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
