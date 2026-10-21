import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import PopoverMenu from "../PopoverMenu";
import MenuItem from "../MenuItem";
import { ICONS } from "../menu-icons";
import { useRoughbooks } from "../roughbooks/roughbooks-context";
import { useToast } from "../toast/toast-context";
import ConfirmDialog from "../../pages/PastQuestions/ConfirmDialog";
import { resignAccount } from "../../lib/api/account";
import { useHistory } from "./history-context";

const WARNING = `Only use this when you are moving to a new class, for example from 3rd year to 4th year.

Changing your user details starts your account fresh. Your old history and bookmarks belong to your old class, and clearing them keeps that material from mixing with your new one:

- Your history will be cleared: every chat and all its messages, including your pinned chats and the chats inside your roughbooks.
- Your bookmarks will be cleared: every past question you saved.

If you are staying in the same class, or only need to fix a small mistake, don't use this. It can't be undone.`;

// The Settings button at the bottom of the sidebar: Change user details, and Sign out.
export default function SettingsMenu({ onNavigate }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh } = useHistory();
  const roughbooks = useRoughbooks();
  const [menu, setMenu] = useState(null); // null | { rect }
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const signOut = () => {
    setMenu(null);
    authClient.signOut({ fetchOptions: { onSuccess: () => navigate("/login") } });
  };

  const askChange = () => {
    setMenu(null);
    setError(null);
    setConfirming(true);
  };

  // If n8n answers with a link, the page is already on its way there and nothing below runs.
  const confirmChange = async () => {
    setBusy(true);
    setError(null);
    try {
      await resignAccount();
    } catch {
      setError("Couldn't start the change. Please try again.");
      setBusy(false);
      return;
    }
    setConfirming(false);
    setBusy(false);
    toast("Your history and bookmarks were cleared");
    refresh().catch(() => {});
    roughbooks.refresh();
    navigate("/new");
    onNavigate?.();
  };

  return (
    <>
      <button
        onClick={(e) => setMenu({ rect: e.currentTarget.getBoundingClientRect() })}
        aria-haspopup="menu"
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
      >
        {ICONS.settings}
        Settings
      </button>

      {menu && (
        <PopoverMenu rect={menu.rect} width={220} onClose={() => setMenu(null)}>
          <MenuItem iconNode={ICONS.user} onClick={askChange}>
            Change user details
          </MenuItem>
          <MenuItem iconNode={ICONS.logout} onClick={signOut} danger>
            Sign out
          </MenuItem>
        </PopoverMenu>
      )}

      {confirming && (
        <ConfirmDialog
          heading="Change your user details?"
          message={WARNING}
          confirmLabel="Clear and continue"
          busy={busy}
          error={error}
          onConfirm={confirmChange}
          onCancel={() => setConfirming(false)}
          delaySeconds={5}
        />
      )}
    </>
  );
}