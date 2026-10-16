import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useVisualViewportHeight from "../../hooks/useVisualViewportHeight";

const MAX_NAME = 60;

// Asks for the roughbook's name. onCreate(name) should return a promise;
// when it succeeds the page moves on, so this box just goes away.
export default function NewRoughbookDialog({ onCreate, onClose }) {
  const viewportHeight = useVisualViewportHeight(); // stays above the phone keyboard
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async () => {
    const value = name.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(value);
    } catch {
      setError("Couldn't create the roughbook. Please try again.");
      setBusy(false);
    }
  };

  return createPortal(
    <div
      style={{ height: viewportHeight }}
      className="fixed left-0 top-0 z-50 flex w-full items-center justify-center p-4 text-zinc-100"
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New roughbook"
        style={{ animation: "sheet-up 280ms ease-out" }}
        className="relative w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
      >
        <h2 className="mb-1 text-lg font-bold">New roughbook</h2>
        <p className="mb-4 text-sm text-zinc-400">What do you want to call it?</p>

        <input
          autoFocus
          value={name}
          maxLength={MAX_NAME}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="e.g. Cardiology notes"
          className="w-full rounded-xl border border-zinc-700 bg-transparent px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 disabled:opacity-60"
        />

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !name.trim()}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
          >
            {busy && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Create
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}