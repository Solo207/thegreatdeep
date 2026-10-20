import { useState } from "react";
import PopoverMenu from "../PopoverMenu";
import MenuItem from "../MenuItem";
import { ICONS } from "../menu-icons";
import { useHistory } from "../sidebar/history-context";
import { useRoughbooks } from "./roughbooks-context";
import { useToast } from "../toast/toast-context";
import NewRoughbookDialog from "../../pages/Roughbooks/NewRoughbookDialog";
import DeleteRoughbookDialog from "../../pages/Roughbooks/DeleteRoughbookDialog";
import { deleteRoughbook, renameRoughbook } from "../../lib/api/rb";

// The menu of a roughbook (Rename, Delete) and the boxes it opens.
//   book       { id, title }
//   rect       where the row (or its dots) is on screen
//   onDeleted  called after the roughbook is gone (e.g. to leave its page)
export default function RoughbookActions({ book, rect, onClose, onDeleted }) {
  const { refresh } = useHistory();
  const roughbooks = useRoughbooks();
  const toast = useToast();
  const [view, setView] = useState("menu"); // menu | rename | delete

  const saveName = async (name) => {
    await renameRoughbook(book.id, name); // if this fails, the box shows the error
    roughbooks.update(book.id, { title: name });
    onClose();
    toast("Roughbook renamed");
    refresh().catch(() => {}); // the chats' "roughbook / title" labels
  };

  const confirmDelete = async (includeChats) => {
    await deleteRoughbook(book.id, includeChats); // if this fails, the box shows the error
    roughbooks.remove(book.id);
    onClose();
    toast(includeChats ? "Roughbook and its chats deleted" : "Roughbook deleted");
    refresh().catch(() => {}); // its chats are gone, or have lost their roughbook
    onDeleted?.();
  };

  if (view === "rename") {
    return (
      <NewRoughbookDialog
        heading="Rename roughbook"
        hint="Choose a new name."
        initial={book.title}
        confirmLabel="Save"
        onCreate={saveName}
        onClose={onClose}
      />
    );
  }

  if (view === "delete") {
    return (
      <DeleteRoughbookDialog name={book.title} onConfirm={confirmDelete} onCancel={onClose} />
    );
  }

  return (
    <PopoverMenu rect={rect} width={200} onClose={onClose}>
      <MenuItem iconNode={ICONS.rename} onClick={() => setView("rename")}>
        Rename
      </MenuItem>
      <MenuItem iconNode={ICONS.trash} onClick={() => setView("delete")} danger>
        Delete
      </MenuItem>
    </PopoverMenu>
  );
}