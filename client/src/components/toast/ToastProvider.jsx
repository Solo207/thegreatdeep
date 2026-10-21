import { useCallback, useEffect, useRef, useState } from "react";
import { NoticeContext, ToastContext } from "./toast-context";
import { hrefFor } from "../../lib/links";

const TOAST_MS = 3000; // a confirmation after an action
const NOTICE_MS = 10000; // a notice from the backend
const MAX_ITEMS = 4;

// Text inside <<…>> is a link. Anything that isn't a normal web link stays plain text.
function noticeParts(text) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(/<<\s*([^<>]+?)\s*>>/g)) {
    const href = hrefFor(m[1]);
    if (!href) continue;
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[1], href });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export default function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const add = useCallback(
    (item, ms) => {
      const id = `${Date.now()}-${Math.random()}`;
      setItems((prev) => [...prev, { ...item, id, ms }].slice(-MAX_ITEMS));
      timers.current.set(id, setTimeout(() => dismiss(id), ms));
    },
    [dismiss]
  );

  const show = useCallback((text, kind = "ok") => add({ kind, text }, TOAST_MS), [add]);
  const notify = useCallback(
    (text) => add({ kind: "notice", parts: noticeParts(String(text)) }, NOTICE_MS),
    [add]
  );

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      <NoticeContext.Provider value={notify}>
        {children}

        <div className="pointer-events-none fixed bottom-6 left-1/2 z-90 flex w-full max-w-md -translate-x-1/2 flex-col-reverse items-center gap-2 px-4">
          {items.map((i) =>
            i.kind === "notice" ? (
              <div
                key={i.id}
                role="status"
                aria-live="polite"
                style={{ animation: "fade-in 150ms ease-out" }}
                className="pointer-events-auto relative w-full overflow-hidden rounded-xl border border-indigo-500/50 bg-zinc-800 py-3 pl-4 pr-10 text-sm text-zinc-100 shadow-2xl"
              >
                <p className="whitespace-pre-wrap wrap-break-word">
                  {i.parts.map((p, n) =>
                    p.href ? (
                      <a
                        key={n}
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
                      >
                        {p.text}
                      </a>
                    ) : (
                      <span key={n}>{p.text}</span>
                    )
                  )}
                </p>
                <button
                  onClick={() => dismiss(i.id)}
                  aria-label="Dismiss"
                  className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
                {/* a thin bar that runs out as the 10 seconds pass */}
                <span
                  style={{ animation: `notice-timer ${i.ms}ms linear forwards` }}
                  className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-indigo-400"
                />
              </div>
            ) : (
              <div
                key={i.id}
                role="status"
                aria-live="polite"
                style={{ animation: "fade-in 150ms ease-out" }}
                className={`pointer-events-none flex max-w-[90vw] items-center gap-2 rounded-xl border px-4 py-2.5 text-sm shadow-2xl ${
                  i.kind === "error"
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
                  {i.kind === "error" ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M5 12l5 5L20 7" />}
                </svg>
                <span>{i.text}</span>
              </div>
            )
          )}
        </div>
      </NoticeContext.Provider>
    </ToastContext.Provider>
  );
}