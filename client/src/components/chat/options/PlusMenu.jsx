import { useState } from "react";
import PopoverMenu from "../../PopoverMenu";
import { getRoughbooks } from "../../../lib/api/rb";
import { searchInfo } from "../../../lib/chatOptions";

const keepFocus = (e) => e.preventDefault(); // tapping + shouldn't close the keyboard
const row =
  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700/60";

function Toggle({ on }) {
  return (
    <span aria-hidden className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-indigo-500" : "bg-zinc-600"}`}>
      <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
    </span>
  );
}

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// /rb may answer with a plain list or wrap it
const listOf = (r) => (Array.isArray(r) ? r : (r?.roughbooks ?? r?.books ?? []));

export default function PlusMenu({ chat }) {
  const { options, loading, isDraft } = chat;
  const [menu, setMenu] = useState(null);
  const [view, setView] = useState("main");
  const [books, setBooks] = useState(null); // null = still loading
  const [failed, setFailed] = useState(false);

  const close = () => setMenu(null);

  const loadBooks = () => {
    setBooks(null);
    setFailed(false);
    getRoughbooks()
      .then((r) => setBooks(listOf(r)))
      .catch(() => setFailed(true));
  };

  const openBooks = () => {
    setView("books");
    loadBooks();
  };

  const pick = (book) => {
    chat.setProject(book ? { id: book.id, name: book.title } : null);
    close();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Chat options"
        aria-haspopup="menu"
        disabled={loading}
        onMouseDown={keepFocus}
        onClick={(e) => {
          setView("main");
          setMenu({ rect: e.currentTarget.getBoundingClientRect() });
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {menu && (
        // the key changes with the view and with loading, so the menu measures itself again
        <PopoverMenu
          key={`${view}-${books === null && !failed ? "wait" : "ready"}`}
          rect={menu.rect}
          width={264}
          onClose={close}
        >
          {view === "main" ? (
            <div className="p-1">
              <p className="px-3 pb-1 pt-2 text-xs text-zinc-500">Applies to this chat only</p>

              <button type="button" onClick={openBooks} className={row}>
                <span className="min-w-0">
                  {options.project ? "Change roughbook" : "Add roughbook"}
                  {options.project && (
                    <span className="block truncate text-xs text-zinc-500">{options.project.name}</span>
                  )}
                </span>
                <Icon d="m9 18 6-6-6-6" />
              </button>

              <button
                type="button"
                role="switch"
                aria-checked={options.webSearch}
                onClick={() => chat.setWebSearch(!options.webSearch)}
                className={row}
              >
                Web search
                <Toggle on={options.webSearch} />
              </button>

              <button
                type="button"
                role="switch"
                aria-checked={options.driveSearch}
                onClick={() => chat.setDriveSearch(!options.driveSearch)}
                className={row}
              >
                Drive search
                <Toggle on={options.driveSearch} />
              </button>

              <p className="px-3 pb-2 pt-1 text-xs text-zinc-500">{searchInfo(options)}</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto p-1">
              <button type="button" onClick={() => setView("main")} className={`${row} justify-start text-zinc-400`}>
                <Icon d="m15 18-6-6 6-6" />
                <span>
                  Roughbook
                  {isDraft && (
                    <span className="block text-xs text-zinc-500">Added once you send your first message</span>
                  )}
                </span>
              </button>

              {failed && (
                <div className="px-3 py-2 text-xs text-red-400">
                  Couldn't load your roughbooks.{" "}
                  <button type="button" onClick={loadBooks} className="underline">
                    Try again
                  </button>
                </div>
              )}

              {!failed && books === null && <p className="px-3 py-2 text-xs text-zinc-500">Loading…</p>}

              {books?.map((b) => (
                <button key={b.id} type="button" onClick={() => pick(b)} className={row}>
                  <span className="truncate">{b.title}</span>
                  {options.project?.id === b.id && <Icon d="M20 6 9 17l-5-5" />}
                </button>
              ))}

              {books && books.length === 0 && (
                <p className="px-3 py-2 text-xs text-zinc-500">No roughbooks yet. Create one from the sidebar.</p>
              )}

              {options.project && (
                <button type="button" onClick={() => pick(null)} className={`${row} text-red-400`}>
                  Remove from roughbook
                </button>
              )}
            </div>
          )}
        </PopoverMenu>
      )}
    </>
  );
}