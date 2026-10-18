import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WIDTH = 224; // px

function icon(path) {
  return (
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
      {path}
    </svg>
  );
}

const ICONS = {
  pin: icon(<path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7" />),
  rename: icon(<path d="M4 20h4L19 9l-4-4L4 16z" />),
  trash: icon(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />),
  folder: icon(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />),
  plus: icon(<path d="M12 5v14M5 12h14" />),
  remove: icon(<path d="M6 6l12 12M18 6L6 18" />),
  check: icon(<path d="M5 12l5 5L20 7" />),
  chevron: icon(<path d="M6 9l6 6 6-6" />),
};

function Item({ iconNode, children, onClick, danger = false, right = null, selected = false }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
        danger ? "text-red-300 hover:bg-red-500/15" : "hover:bg-zinc-800"
      } ${selected ? "bg-zinc-800/60" : ""}`}
    >
      {iconNode}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {right}
    </button>
  );
}

// The tiny menu of a sidebar chat: Pin, Rename, Delete and Add to projects.
export default function ChatItemMenu({
  rect, // where the chat row (or its 3 dots) is on screen
  pinned,
  rough, // the roughbook name the chat is in, or ""
  books, // the user's roughbooks [{ id, title }]
  booksStatus, // idle | loading | ready | error
  onClose,
  onPin,
  onRename,
  onDelete,
  onNeedBooks,
  onPick,
  onNewRough,
  onRemoveRough,
}) {
  const [listOpen, setListOpen] = useState(false);
  const openedAt = useRef(Date.now());

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openList = () => {
    setListOpen(true);
    onNeedBooks();
  };
  const toggleList = () => (listOpen ? setListOpen(false) : openList());
  // with a mouse, hovering shows the list; on a phone, tapping does
  const hoverList = () => {
    if (!listOpen && window.matchMedia("(hover: hover)").matches) openList();
  };

  // under the row, or above it when there is no room below
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - WIDTH - 8));
  const placement =
    window.innerHeight - rect.bottom > 300
      ? { top: rect.bottom + 4, left }
      : { bottom: window.innerHeight - rect.top + 4, left };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-60"
        onClick={() => {
          if (Date.now() - openedAt.current > 350) onClose();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        role="menu"
        style={{ ...placement, width: WIDTH, animation: "fade-in 120ms ease-out" }}
        className="fixed z-61 rounded-xl border border-zinc-700 bg-zinc-900 p-1 text-sm text-zinc-100 shadow-2xl"
      >
        <Item iconNode={ICONS.pin} onClick={onPin}>
          {pinned ? "Unpin" : "Pin"}
        </Item>
        <Item iconNode={ICONS.rename} onClick={onRename}>
          Rename
        </Item>
        <Item iconNode={ICONS.trash} onClick={onDelete} danger>
          Delete
        </Item>

        <div onMouseEnter={hoverList}>
          <Item
            iconNode={ICONS.folder}
            onClick={toggleList}
            right={
              <span className={`transition-transform ${listOpen ? "rotate-180" : ""}`}>
                {ICONS.chevron}
              </span>
            }
          >
            {rough ? "Change roughbook" : "Add to roughbook"}
          </Item>

          {listOpen && (
            <div className="mx-1 mb-1 mt-0.5 border-l border-zinc-800 pl-1">
              <div className="max-h-40 overflow-y-auto">
                {(booksStatus === "idle" || booksStatus === "loading") && (
                  <p className="px-2.5 py-2 text-zinc-500">Loading…</p>
                )}
                {booksStatus === "error" && (
                  <p className="px-2.5 py-2 text-zinc-500">Couldn't load</p>
                )}
                {booksStatus === "ready" &&
                  books.map((b) => (
                    <Item
                      key={b.id}
                      iconNode={b.title === rough ? ICONS.check : <span className="h-4 w-4 shrink-0" />}
                      onClick={() => onPick(b)}
                      selected={b.title === rough}
                    >
                      {b.title}
                    </Item>
                  ))}
              </div>
              <Item iconNode={ICONS.plus} onClick={onNewRough}>
                New roughbook
              </Item>
              {rough && (
                <Item iconNode={ICONS.remove} onClick={onRemoveRough} danger>
                  Remove from roughbook
                </Item>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}