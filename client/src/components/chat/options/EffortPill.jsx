import { useState } from "react";
import PopoverMenu from "../../PopoverMenu";

const LEVELS = [
  { id: "low", label: "Low", note: "quick and efficient" },
  { id: "medium", label: "Medium", note: "balanced depth" },
  { id: "high", label: "High", note: "extra thorough" },
];

export default function EffortPill({ chat }) {
  const [menu, setMenu] = useState(null);
  const current = LEVELS.find((l) => l.id === chat.options.effort) ?? LEVELS[1];

  return (
    <>
      <button
        type="button"
        aria-haspopup="listbox"
        disabled={chat.loading}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => setMenu({ rect: e.currentTarget.getBoundingClientRect() })}
        className="shrink-0 whitespace-nowrap rounded-full bg-zinc-700/60 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-40"
      >
        Effort: {current.label}
      </button>

      {menu && (
        <PopoverMenu rect={menu.rect} width={230} onClose={() => setMenu(null)}>
          <div className="p-1">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  chat.setEffort(l.id);
                  setMenu(null);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700/60"
              >
                <span>
                  {l.label}
                  <span className="block text-xs text-zinc-500">{l.note}</span>
                </span>
                {l.id === current.id && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </PopoverMenu>
      )}
    </>
  );
}