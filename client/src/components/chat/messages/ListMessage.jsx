import { useState } from "react";
import Markdown from "../Markdown";
import BottomSheet from "./BottomSheet";

// An outlined box holding the question and a button that opens the options.
// After a choice, the button shows what was picked.
export default function ListMessage({ message, active, chosenText, onSelect }) {
  const [open, setOpen] = useState(false);
  const { body, buttonLabel, sections = [] } = message.content;

  // the chosen row is the one whose title the user sent next
  let chosen = null;
  if (chosenText) {
    for (const s of sections) {
      for (const r of s.rows) if (r.title === chosenText) chosen = r;
    }
  }

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
        <BottomSheet title={buttonLabel} onClose={() => setOpen(false)}>
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="px-4 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {section.title}
                </p>
              )}
              {section.rows.map((row) => {
                const isChosen = chosen?.id === row.id;
                return (
                  <button
                    key={row.id}
                    disabled={!active}
                    onClick={() => {
                      setOpen(false);
                      onSelect(row.title, {
                        id: row.id,
                        source: "list",
                        messageId: message.id,
                      });
                    }}
                    className={`block w-full px-4 py-3 text-left transition-colors ${
                      isChosen
                        ? "bg-indigo-500/15"
                        : active
                        ? "cursor-pointer hover:bg-zinc-800"
                        : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    <span className="block font-medium">{row.title}</span>
                    {row.description && (
                      <span className="block text-sm text-zinc-400">{row.description}</span>
                    )}
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