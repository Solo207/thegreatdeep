import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// "Delete this roughbook?" with a checkbox: also delete the chats in it (checked by default).
// onConfirm(includeChats) returns a promise; when it works, the caller closes this box.
export default function DeleteRoughbookDialog({ name, onConfirm, onCancel }) {
  const [includeChats, setIncludeChats] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(includeChats);
    } catch {
      setError("Couldn't delete it. Please try again.");
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-zinc-100">
      <div className="absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete roughbook"
        style={{ animation: "sheet-up 280ms ease-out" }}
        className="relative w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
      >
        <h2 className="mb-2 text-lg font-bold">Delete this roughbook?</h2>
        <p className="text-zinc-300">"{name}" will be deleted for good.</p>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-700 p-3">
          <input
            type="checkbox"
            checked={includeChats}
            disabled={busy}
            onChange={(e) => setIncludeChats(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-indigo-500"
          />
          <span>
            Also delete all the chats in it
            <span className="mt-0.5 block text-xs text-zinc-500">
              Unchecked: the chats are kept and just leave the roughbook.
            </span>
          </span>
        </label>

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
            onClick={confirm}
            disabled={busy}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-400 disabled:cursor-wait disabled:opacity-70"
          >
            {busy && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}