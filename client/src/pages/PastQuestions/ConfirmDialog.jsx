import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function ConfirmDialog({
  heading,
  message,
  confirmLabel = "Confirm",
  busy = false,
  error = "",
  delaySeconds = 0,
  mustScroll = false,
  onConfirm,
  onCancel,
}) {
  const [wait, setWait] = useState(delaySeconds);
  const [atEnd, setAtEnd] = useState(!mustScroll);
  const scrollRef = useRef(null);

  // Countdown only starts once the text has been read to the end
  useEffect(() => {
    if (!atEnd || wait <= 0) return;
    const t = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [atEnd, wait]);

  const checkEnd = () => {
    const el = scrollRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 4) setAtEnd(true);
  };

  // Short text that doesn't overflow counts as already read
  useLayoutEffect(() => {
    if (mustScroll) checkEnd();
  }, [mustScroll]);

  const waitingForScroll = mustScroll && !atEnd;
  const locked = busy || waitingForScroll || wait > 0;
  const label = waitingForScroll
    ? "Scroll to the end to continue"
    : wait > 0
      ? `${confirmLabel} (${wait})`
      : confirmLabel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-bold">{heading}</h2>

        <div
          ref={scrollRef}
          onScroll={checkEnd}
          className={`whitespace-pre-line text-sm leading-relaxed text-zinc-300 ${
            mustScroll ? "max-h-60 overflow-y-auto pr-2" : ""
          }`}
        >
          {message}
        </div>

        {waitingForScroll && (
          <p className="mt-2 text-xs text-zinc-500">Scroll down to read everything ↓</p>
        )}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {label}
          </button>
        </div>
      </div>
    </div>
  );
}