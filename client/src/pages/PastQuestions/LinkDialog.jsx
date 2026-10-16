import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// How long after the link arrives the new tab opens by itself, in milliseconds.
// Short on purpose: browsers allow a new tab only soon after your tap.
const OPEN_DELAY_MS = 300;

// Shows the link and opens it in a NEW tab as soon as it arrives.
// If the browser blocks that, the link in the box opens it when tapped.
export default function LinkDialog({ state, heading, message, link, onClose }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (state !== "ready" || !link) return;
    const timer = setTimeout(() => {
      const win = window.open(link, "_blank");
      if (win) win.opener = null; // the new page can't reach back into this one
      else setBlocked(true); // the browser stopped it: the link below still works
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, link]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-zinc-100">
      <div className="absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        style={{ animation: "sheet-up 280ms ease-out" }}
        className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
      >
        <h2 className="mb-3 text-lg font-bold">{heading}</h2>

        {state === "loading" && (
          <div className="flex items-center gap-3 text-zinc-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
            Getting your link ready…
          </div>
        )}

        {state === "ready" && (
          <>
            <p className="text-zinc-300">{message}</p>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block break-all rounded-xl border border-indigo-400/60 px-4 py-3 text-indigo-200 underline decoration-indigo-300/50 underline-offset-2 transition-colors hover:bg-indigo-500/15"
            >
              {link}
            </a>
            <p className="mt-3 text-sm text-zinc-500">
              {blocked
                ? "Your browser didn't open it by itself. Tap the link above."
                : "Opening it in a new tab…"}
            </p>
          </>
        )}

        {state === "error" && (
          <p className="text-zinc-300">Couldn't get the link. Please try again.</p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm transition-colors hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}