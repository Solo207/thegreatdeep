import { useState } from "react";
import Markdown from "../Markdown";
import BottomSheet from "./BottomSheet";
import Radio from "./Radio";

// An outlined box with the question and a button that opens the options.
// Picking a row only highlights it; the Send button in the panel sends it.
// After sending, the button shows what was picked.
export default function ListMessage({ message, active, chosenText, onSelect }) {
  const [open, setOpen] = useState(false);
  const [pickedId, setPickedId] = useState(null); // highlighted in the panel, not sent yet
  const { body, buttonLabel, sections = [] } = message.content;

  const allRows = sections.flatMap((s) => s.rows);
  // the chosen row is the one whose title the user sent next
  const chosen = chosenText ? allRows.find((r) => r.title === chosenText) ?? null : null;
  const picked = allRows.find((r) => r.id === pickedId) ?? null;

  const send = () => {
    if (!picked) return;
    setOpen(false);
    onSelect(picked.title, { id: picked.id, source: "list", messageId: message.id });
  };

  return (
    <div className="max-w-md rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4">
      {body && <Markdown>{body}</Markdown>}

      <button
        onClick={() => setOpen(true)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
          body ? "mt-3" : ""
        } ${
          chosen
            ? "border-indigo-500 bg-indigo-500/15 text-indigo-100"
            : active
            ? "border-indigo-400/60 text-indigo-200 hover:bg-indigo-500/15"
            : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
        }`}
      >
        <span className="truncate">{chosen ? chosen.title : buttonLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0"
        >
          {chosen ? <path d="M5 12l5 5L20 7" /> : <path d="M6 15l6-6 6 6" />}
        </svg>
      </button>

      {open && (
        <BottomSheet
          title={buttonLabel}
          onClose={() => setOpen(false)}
          footer={
            active ? (
              <button
                onClick={send}
                disabled={!picked}
                className="w-full cursor-pointer rounded-xl bg-indigo-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                Send
              </button>
            ) : null
          }
        >
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="px-4 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {section.title}
                </p>
              )}
              {section.rows.map((row) => {
                const selected = chosen ? chosen.id === row.id : picked?.id === row.id;
                return (
                  <button
                    key={row.id}
                    disabled={!active}
                    onClick={() => setPickedId(row.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      selected
                        ? "bg-indigo-500/15"
                        : active
                        ? "cursor-pointer hover:bg-zinc-800"
                        : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    <span className="mt-0.5">
                      <Radio selected={selected} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{row.title}</span>
                      {row.description && (
                        <span className="block text-sm text-zinc-400">{row.description}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </BottomSheet>
      )}
    </div>
  );
}