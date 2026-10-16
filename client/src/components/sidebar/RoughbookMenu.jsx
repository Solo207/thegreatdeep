import { useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useRoughbooks } from "../roughbooks/roughbooks-context";

// The "Rough books" row: the label opens /roughbook (and the list), the chevron at the
// end only opens or closes the list of roughbook titles.
export default function RoughbookMenu({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const { books, status, ensureLoaded, refresh } = useRoughbooks();
  const activeId = useMatch("/roughbook/:rbId")?.params.rbId;

  const toggle = () => {
    if (!open) ensureLoaded(); // asks n8n (rb) the first time the list opens
    setOpen((v) => !v);
  };

  const goToPage = () => {
    setOpen(true);
    ensureLoaded();
    onNavigate?.();
  };

  return (
    <div className="mt-1">
      <div className="flex items-center rounded-lg transition-colors hover:bg-zinc-800">
        <Link
          to="/roughbook"
          onClick={goToPage}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm text-zinc-100"
        >
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
            <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
            <path d="M9 8h6M9 12h6" />
          </svg>
          <span className="truncate">Rough books</span>
        </Link>
        <button
          onClick={toggle}
          aria-label={open ? "Hide rough books" : "Show rough books"}
          aria-expanded={open}
          className="mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="ml-4 mt-1 max-h-48 overflow-y-auto border-l border-zinc-800 pl-2">
          {(status === "idle" || status === "loading") && (
            <div className="space-y-1.5 py-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="mx-1 h-6 animate-pulse rounded-md bg-zinc-800/60" />
              ))}
            </div>
          )}

          {status === "error" && (
            <p className="px-3 py-2 text-sm text-zinc-400">
              Couldn't load.{" "}
              <button onClick={refresh} className="underline hover:text-zinc-100">
                Retry
              </button>
            </p>
          )}

          {status === "ready" && books.length === 0 && (
            <p className="px-3 py-2 text-sm text-zinc-500">No roughbooks yet</p>
          )}

          {status === "ready" &&
            books.map((b) => (
              <Link
                key={b.id}
                to={`/roughbook/${b.id}`}
                onClick={onNavigate}
                className={`block truncate rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  b.id === activeId
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-300 hover:bg-zinc-800/60"
                }`}
              >
                {b.title}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}