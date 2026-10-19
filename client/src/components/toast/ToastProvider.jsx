import { useCallback, useEffect, useRef, useState } from "react";
import { ToastContext } from "./toast-context";

const SHOW_MS = 3000; // how long a notification stays

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // null | { id, text, kind }
  const timer = useRef(null);

  const show = useCallback((text, kind = "ok") => {
    clearTimeout(timer.current);
    setToast({ id: Date.now() + Math.random(), text, kind });
    timer.current = setTimeout(() => setToast(null), SHOW_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          style={{ animation: "fade-in 150ms ease-out" }}
          className={`pointer-events-none fixed bottom-6 left-1/2 z-90 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm shadow-2xl ${
            toast.kind === "error"
              ? "border-red-900 bg-red-950 text-red-100"
              : "border-zinc-700 bg-zinc-800 text-zinc-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
          >
            {toast.kind === "error" ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M5 12l5 5L20 7" />}
          </svg>
          <span>{toast.text}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}