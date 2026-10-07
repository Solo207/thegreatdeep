import { useEffect } from "react";
import { createPortal } from "react-dom";

// A panel that slides up from the bottom of the screen
export default function BottomSheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center text-zinc-100">
      <div
        className="absolute inset-0 bg-black/60"
        style={{ animation: "fade-in 200ms ease-out" }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ animation: "sheet-up 280ms ease-out" }}
        className="relative flex max-h-[75dvh] w-full max-w-lg flex-col rounded-t-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}