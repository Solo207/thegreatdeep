import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatItemMenu from "./ChatItemMenu";
import RenameDialog from "./RenameDialog";
import { useHistory } from "./history-context";
import { useRoughbooks } from "../roughbooks/roughbooks-context";
import { useToast } from "../toast/toast-context";
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

// The menu of a chat (Pin, Rename, Delete, Roughbook) and the boxes it opens.
// Used by the sidebar, the /chats page, a roughbook's chat history and the chat header.
//   rect, roughId, rough  where the row is, and (optionally) the roughbook the chat is in;
//                         they default to what the chat itself says (chat.roughId, chat.rough)
//   onChanged             called after any change, so a page can reload its own list
export default function ChatActions({
  chat,
  rect,
  rough = "",
  roughId = "",
  active = false,
  onClose,
  onNavigate,
  onChanged,
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh, pinned: pinnedList } = useHistory();
  const roughbooks = useRoughbooks();
  const [view, setView] = useState("menu"); // menu | rename | delete | newrough
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const roughName = rough || chat.rough || "";
  const currentRoughId = roughId || chat.roughId || "";
  const hasRough = Boolean(roughName || currentRoughId);
  const isPinned = chat.pin === true || pinnedList.some((p) => p.id === chat.id);

  // the roughbook the chat is in: matched by id; by name only if no id is known
  const isCurrent = (b) =>
    currentRoughId ? b.id === currentRoughId : Boolean(roughName) && b.title === roughName;

  // reload every list that shows chats, in the background.
  // It can never turn a finished action into an error message.
  const reloadQuietly = () => {
    (async () => {
      await refresh();
      await onChanged?.();
    })().catch((err) => console.error("Reloading the lists failed:", err));
  };

  // the quick actions: only the action itself can report an error
  const run = async (action, doneText) => {
    onClose();
    try {
      await action();
    } catch (err) {
      console.error("Chat action failed:", err);
      toast("Something went wrong. Please try again.", "error");
      return;
    }
    toast(doneText);
    reloadQuietly();
  };

  const pick = (book) => {
    if (isCurrent(book)) {
      onClose();
      toast(`Already in ${book.title}`);
      return;
    }
    run(
      () => addChatToRough(chat.id, book),
      hasRough ? `Moved to ${book.title}` : `Added to ${book.title}`
    );
  };

  const saveName = async (name) => {
    await renameChat(chat.id, name); // if this fails, the box shows the error
    onClose();
    toast("Chat renamed");
    reloadQuietly();
  };

  const confirmDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteChats([chat.id]);
    } catch {
      setError("Couldn't delete it. Please try again.");
      setBusy(false);
      return;
    }
    // it worked: nothing below can report an error
    onClose();
    toast("Chat deleted");
    reloadQuietly();
    if (active) {
      navigate("/new");
      onNavigate?.();
    }
  };

  // a brand new roughbook: create it, put this chat in it, then open it
  const createAndAdd = async (name) => {
    const id = await createRoughbook(name);
    roughbooks.add({ id, title: name, last_updated: "just now" });
    await addChatToRough(chat.id, { id, title: name });
    onClose();
    toast(`Added to ${name}`);
    reloadQuietly();
    navigate(`/roughbook/${id}`);
    onNavigate?.();
  };

  if (view === "rename") {
    return <RenameDialog initial={chat.title} onSave={saveName} onClose={onClose} />;
  }

  if (view === "delete") {
    return (
      <ConfirmDialog
        heading="Delete this chat?"
        message={`"${chat.title}" will be deleted for good.`}
        busy={busy}
        error={error}
        onConfirm={confirmDelete}
        onCancel={onClose}
      />
    );
  }

  if (view === "newrough") {
    return <NewRoughbookDialog onCreate={createAndAdd} onClose={onClose} />;
  }

  return (
    <ChatItemMenu
      rect={rect}
      pinned={isPinned}
      hasRough={hasRough}
      isCurrent={isCurrent}
      books={roughbooks.books}
      booksStatus={roughbooks.status}
      onClose={onClose}
      onPin={() =>
        run(() => pinChat(chat.id, !isPinned), isPinned ? "Chat unpinned" : "Chat pinned")
      }
      onRename={() => setView("rename")}
      onDelete={() => {
        setError(null);
        setView("delete");
      }}
      onNeedBooks={roughbooks.ensureLoaded}
      onPick={pick}
      onNewRough={() => setView("newrough")}
      onRemoveRough={() =>
        run(
          () => removeChatFromRough(chat.id, { id: currentRoughId, name: roughName }),
          "Removed from roughbook"
        )
      }
    />
  );
}