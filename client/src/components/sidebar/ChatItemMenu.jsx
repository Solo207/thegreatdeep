import { useState } from "react";
import PopoverMenu from "../PopoverMenu";
import MenuItem from "../MenuItem";
import { ICONS } from "../menu-icons";

// The tiny menu of a chat: Pin, Rename, Delete and Add to / Change roughbook.
//   hasRough  the chat is already in a roughbook
//   roughId   that roughbook's id (the tick is placed by id, never by name)
export default function ChatItemMenu({
  rect,
  pinned,
  hasRough,
  roughId,
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

  const openList = () => {
    setListOpen(true);
    onNeedBooks();
  };
  const toggleList = () => (listOpen ? setListOpen(false) : openList());
  // with a mouse, hovering shows the list; on a phone, tapping does
  const hoverList = () => {
    if (!listOpen && window.matchMedia("(hover: hover)").matches) openList();
  };

  return (
    <PopoverMenu rect={rect} onClose={onClose}>
      <MenuItem iconNode={ICONS.pin} onClick={onPin}>
        {pinned ? "Unpin" : "Pin"}
      </MenuItem>
      <MenuItem iconNode={ICONS.rename} onClick={onRename}>
        Rename
      </MenuItem>
      <MenuItem iconNode={ICONS.trash} onClick={onDelete} danger>
        Delete
      </MenuItem>

      <div onMouseEnter={hoverList}>
        <MenuItem
          iconNode={ICONS.folder}
          onClick={toggleList}
          right={
            <span className={`transition-transform ${listOpen ? "rotate-180" : ""}`}>
              {ICONS.chevron}
            </span>
          }
        >
          {hasRough ? "Change roughbook" : "Add to roughbook"}
        </MenuItem>

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
                  <MenuItem
                    key={b.id}
                    iconNode={
                      b.id === roughId ? ICONS.check : <span className="h-4 w-4 shrink-0" />
                    }
                    onClick={() => onPick(b)}
                    selected={b.id === roughId}
                  >
                    {b.title}
                  </MenuItem>
                ))}
            </div>
            <MenuItem iconNode={ICONS.plus} onClick={onNewRough}>
              New roughbook
            </MenuItem>
            {hasRough && (
              <MenuItem iconNode={ICONS.remove} onClick={onRemoveRough} danger>
                Remove from roughbook
              </MenuItem>
            )}
          </div>
        )}
      </div>
    </PopoverMenu>
  );
}