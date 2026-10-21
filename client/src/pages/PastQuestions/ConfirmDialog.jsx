import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// A small "are you sure?" box.
//   delaySeconds  keeps the confirm button switched off for that many seconds (with a
//                 countdown), so the message gets read. Cancel always works.
export default function ConfirmDialog({
  heading,
  message,
  confirmLabel = "Delete",
  busy = false,
  error = null,
  delaySeconds = 0,
  onConfirm,
  onCancel,
}) {
  const [wait, setWait] = useState(delaySeconds);

  // the countdown
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const locked = wait > 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-zinc-100">
      <div className="absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        style={{ animation: "sheet-up 280ms ease-out" }}
        className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
      >
        <h2 className="mb-2 text-lg font-bold">{heading}</h2>
        <p className="whitespace-pre-wrap text-zinc-300">{message}</p>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy || locked}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {locked ? `${confirmLabel} (${wait})` : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}