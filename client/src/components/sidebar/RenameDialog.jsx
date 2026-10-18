import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useVisualViewportHeight from "../../hooks/useVisualViewportHeight";

const MAX_TITLE = 100;

// Asks for a new chat name. onSave(name) returns a promise; when it works the caller closes this.
export default function RenameDialog({ initial, onSave, onClose }) {
  const viewportHeight = useVisualViewportHeight(); // stays above the phone keyboard
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const value = name.trim();
  const canSave = value.length > 0 && value !== initial.trim() && !busy;

  const submit = async () => {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(value);
    } catch {
      setError("Couldn't rename it. Please try again.");
      setBusy(false);
    }
  };

  return createPortal(
    <div
      style={{ height: viewportHeight }}
      className="fixed left-0 top-0 z-70 flex w-full items-center justify-center p-4 text-zinc-100"
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Rename chat"
        style={{ animation: "sheet-up 280ms ease-out" }}
        className="relative w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-bold">Rename chat</h2>
        <input
          autoFocus
          value={name}
          maxLength={MAX_TITLE}
          disabled={busy}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="w-full rounded-xl border border-zinc-700 bg-transparent px-4 py-3 text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-60"
        />
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm transition-colors hover:bg-zinc-800 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSave}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
          >
            {busy && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}