import { useRef, useState } from "react";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { useRoughbooks } from "../roughbooks/roughbooks-context";
import RoughbookActions from "../roughbooks/RoughbookActions";
import useLongPress from "./useLongPress";

// One roughbook in the dropdown: a link, a 3-dots button on hover (computers)
// and a menu on long press (phones).
function BookRow({ book, active, onNavigate }) {
  const navigate = useNavigate();
  const rowRef = useRef(null);
  const [menu, setMenu] = useState(null); // null | { rect }

  const openMenu = (el) => setMenu({ rect: el.getBoundingClientRect() });
  const longPress = useLongPress(() => {
    if (rowRef.current) openMenu(rowRef.current);
  });

  return (
    <div
      ref={rowRef}
      className="group relative select-none [-webkit-touch-callout:none]"
      {...longPress}
    >
      <Link
        to={`/roughbook/${book.id}`}
        onClick={onNavigate}
        className={`block truncate rounded-lg py-1.5 pl-3 pr-3 text-sm transition-colors group-hover:pr-9 ${
          active ? "bg-zinc-800 text-zinc-50" : "text-zinc-300 group-hover:bg-zinc-800/60"
        }`}
      >
        {book.title}
      </Link>

      <button
        onClick={(e) => openMenu(e.currentTarget)}
        aria-label="Roughbook options"
        className={`absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-opacity hover:bg-zinc-700 hover:text-zinc-100 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden ${
          menu ? "opacity-100" : "opacity-0"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      {menu && (
        <RoughbookActions
          book={book}
          rect={menu.rect}
          onClose={() => setMenu(null)}
          onDeleted={() => {
            if (active) {
              navigate("/roughbook");
              onNavigate?.();
            }
          }}
        />
      )}
    </div>
  );
}

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
              <BookRow key={b.id} book={b} active={b.id === activeId} onNavigate={onNavigate} />
            ))}
        </div>
      )}
    </div>
  );
}