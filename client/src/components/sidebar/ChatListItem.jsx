import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useLongPress from "./useLongPress";
import ChatItemMenu from "./ChatItemMenu";
import RenameDialog from "./RenameDialog";
import { useHistory } from "./history-context";
import { useRoughbooks } from "../roughbooks/roughbooks-context";
import ConfirmDialog from "../../pages/PastQuestions/ConfirmDialog";
import NewRoughbookDialog from "../../pages/Roughbooks/NewRoughbookDialog";
import { createRoughbook } from "../../lib/api/rb";
import {
  addChatToRough,
  deleteChats,
  pinChat,
  removeChatFromRough,
  renameChat,
} from "../../lib/api/chatActions";

// One chat in the sidebar: a link, a 3-dots button on hover (computers)
// and a menu on long press (phones).
export default function ChatListItem({ chat, active = false, onNavigate }) {
  const navigate = useNavigate();
  const { refresh, pinned: pinnedList } = useHistory();
  const roughbooks = useRoughbooks();
  const rowRef = useRef(null);

  const [menu, setMenu] = useState(null); // null | { rect }
  const [dialog, setDialog] = useState(null); // null | "rename" | "delete" | "newrough"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const isPinned = pinnedList.some((p) => p.id === chat.id);

  const openMenu = (el) => setMenu({ rect: el.getBoundingClientRect() });
  const longPress = useLongPress(() => {
    if (rowRef.current) openMenu(rowRef.current);
  });
  const closeMenu = () => setMenu(null);
  const openDialog = (name) => {
    closeMenu();
    setError(null);
    setDialog(name);
  };
  const closeDialog = () => {
    setDialog(null);
    setBusy(false);
    setError(null);
  };

  // the quick actions: do it, then reload the lists
  const run = async (action) => {
    closeMenu();
    try {
      await action();
      await refresh();
    } catch (err) {
      console.error("Chat action failed:", err);
    }
  };
  const togglePin = () => run(() => pinChat(chat.id, !isPinned));
  const pickRough = (book) => run(() => addChatToRough(chat.id, book));
  const removeRough = () => run(() => removeChatFromRough(chat.id, chat.rough));

  const saveName = async (name) => {
    await renameChat(chat.id, name);
    await refresh();
    closeDialog();
  };

  const confirmDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteChats([chat.id]);
      await refresh();
      closeDialog();
      if (active) {
        navigate("/new");
        onNavigate?.();
      }
    } catch {
      setError("Couldn't delete it. Please try again.");
      setBusy(false);
    }
  };

  // a brand new roughbook: create it, put this chat in it, then open it
  const createAndAdd = async (name) => {
    const id = await createRoughbook(name);
    roughbooks.add({ id, title: name, last_updated: "just now" });
    await addChatToRough(chat.id, { id, title: name });
    await refresh();
    closeDialog();
    navigate(`/roughbook/${id}`);
    onNavigate?.();
  };

  return (
    <div
      ref={rowRef}
      className="group relative select-none [-webkit-touch-callout:none]"
      {...longPress}
    >
      <Link
        to={`/chat/${chat.id}`}
        onClick={onNavigate}
        className={`flex w-full items-center gap-3 rounded-lg py-2 pl-3 pr-3 text-sm transition-colors group-hover:pr-9 ${
          active ? "bg-zinc-800 text-zinc-50" : "text-zinc-300 group-hover:bg-zinc-800/60"
        }`}
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full border transition-colors ${
            active
              ? "border-indigo-400 bg-indigo-400"
              : "border-zinc-600 group-hover:border-zinc-300"
          }`}
        />
        <span className="truncate">{chat.title}</span>
      </Link>

      {/* the 3 dots: only with a mouse, and only while hovering */}
      <button
        onClick={(e) => openMenu(e.currentTarget)}
        aria-label="Chat options"
        className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-opacity hover:bg-zinc-700 hover:text-zinc-100 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden ${
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
        <ChatItemMenu
          rect={menu.rect}
          pinned={isPinned}
          rough={chat.rough || ""}
          books={roughbooks.books}
          booksStatus={roughbooks.status}
          onClose={closeMenu}
          onPin={togglePin}
          onRename={() => openDialog("rename")}
          onDelete={() => openDialog("delete")}
          onNeedBooks={roughbooks.ensureLoaded}
          onPick={pickRough}
          onNewRough={() => openDialog("newrough")}
          onRemoveRough={removeRough}
        />
      )}

      {dialog === "rename" && (
        <RenameDialog initial={chat.title} onSave={saveName} onClose={closeDialog} />
      )}
      {dialog === "delete" && (
        <ConfirmDialog
          heading="Delete this chat?"
          message={`"${chat.title}" will be deleted for good.`}
          busy={busy}
          error={error}
          onConfirm={confirmDelete}
          onCancel={closeDialog}
        />
      )}
      {dialog === "newrough" && (
        <NewRoughbookDialog onCreate={createAndAdd} onClose={closeDialog} />
      )}
    </div>
  );
}