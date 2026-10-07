import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useVisualViewportHeight from "../../../hooks/useVisualViewportHeight";
import Radio from "./Radio";
import { isAnswered } from "./qa-utils";

// The questions pop-up: one question at a time.
export default function QaModal({
  questions,
  step,
  answers,
  onAnswer,
  onBack,
  onNext,
  onSubmit,
  onClose,
}) {
  const viewportHeight = useVisualViewportHeight(); // stays above the phone keyboard
  const dialogRef = useRef(null);

  const q = questions[step];
  const answer = answers[q.id];
  const isLast = step === questions.length - 1;
  const valid = isAnswered(q, answer);

  const advance = () => {
    if (!valid) return;
    if (isLast) onSubmit();
    else onNext();
  };

  // start with focus inside the pop-up
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Escape closes. Focus can't escape, so the chat box behind can't take keystrokes.
  useEffect(() => {
    const dialog = dialogRef.current;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onFocusIn = (e) => {
      if (dialog && !dialog.contains(e.target)) dialog.focus();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [onClose]);

  return createPortal(
    <div
      style={{ height: viewportHeight }}
      className="fixed left-0 top-0 z-50 flex w-full items-center justify-center p-4 text-zinc-100"
    >
      <div className="absolute inset-0 bg-black/70" />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Questions"
        style={{ animation: "sheet-up 280ms ease-out" }}
        className="relative flex max-h-full w-full max-w-lg flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl outline-none"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h2 className="text-sm font-medium text-zinc-400">
            {questions.length > 1 ? `Question ${step + 1} of ${questions.length}` : "Question"}
          </h2>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-4 whitespace-pre-wrap font-medium leading-relaxed">{q.text}</p>

          <div className="flex flex-col gap-2">
            {q.options.map((o) => {
              const selected = answer?.optionId === o.id;
              const frame = selected
                ? "border-indigo-500 bg-indigo-500/15"
                : "border-zinc-700 hover:bg-zinc-800";

              // a typed answer: the label is the placeholder
              if (o.kind === "input") {
                return (
                  <div key={o.id}>
                    <label
                      className={`flex cursor-text items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${frame}`}
                    >
                      <Radio selected={selected} />
                      <input
                        type={o.input.inputType}
                        value={answer?.texts?.[o.id] ?? ""}
                        maxLength={o.input.maxLength}
                        placeholder={o.label}
                        onFocus={() => {
                          if (!selected) onAnswer(q.id, { optionId: o.id });
                        }}
                        onChange={(e) =>
                          onAnswer(q.id, {
                            optionId: o.id,
                            texts: { ...answer?.texts, [o.id]: e.target.value },
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") advance();
                        }}
                        className="min-w-0 flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 outline-none"
                      />
                    </label>
                    {o.input.placeholder && (
                      <p className="mt-1 pl-12 text-xs text-zinc-500">{o.input.placeholder}</p>
                    )}
                  </div>
                );
              }

              // a plain choice
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onAnswer(q.id, { optionId: o.id })}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${frame}`}
                >
                  <Radio selected={selected} />
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-800 px-5 py-4">
          <div className="flex gap-1.5">
            {questions.length > 1 &&
              questions.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-6 rounded-full ${
                    i === step ? "bg-indigo-400" : i < step ? "bg-indigo-400/50" : "bg-zinc-700"
                  }`}
                />
              ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={onBack}
                className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm transition-colors hover:bg-zinc-800"
              >
                Back
              </button>
            )}
            <button
              onClick={advance}
              disabled={!valid}
              className="cursor-pointer rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
            >
              {isLast ? "Send" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}