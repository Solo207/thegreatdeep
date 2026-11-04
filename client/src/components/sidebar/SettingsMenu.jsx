import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PopoverMenu from "../PopoverMenu";
import MenuItem from "../MenuItem";
import { ICONS } from "../menu-icons";
import ConfirmDialog from "../../pages/PastQuestions/ConfirmDialog";
import { authClient } from "../../lib/auth-client";
import { resignAccount } from "../../lib/api/account";
import { useToast } from "../toast/toast-context";
import { useHistory } from "./history-context";
import { useRoughbooks } from "../roughbooks/roughbooks-context";

const CHANGE_DETAILS_TEXT = `Only use this when you are moving to a new class, for example from 3rd year to 4th year.

Why this exists
Your history and bookmarks belong to the class you are leaving. When you move up, your courses, topics and past questions change, and keeping the old material would mix it with your new class. Changing your user details gives you a clean start.

What will be cleared
• Your history: every chat and all of its messages, including pinned chats and the chats inside your roughbooks.
• Your bookmarks: every past question you saved.

What to do first
• Copy anything from your chats that you want to keep (use the copy icon under a message).
• Save any notes or links you still need somewhere else.

When not to use it
If you are staying in the same class, or you only want to fix a small mistake, do not use this. Nothing cleared here can be brought back.

You have reached the end. The button will unlock in a few seconds.`;

const ICON = "h-4 w-4 shrink-0";
const SETTINGS_ICONS = {
  profile: (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

// icon + text in one row; it goes inside MenuItem's children, so it works
// even though MenuItem ignores an `icon` prop
const Label = ({ icon, className = "", children }) => (
  <span className={`flex items-center gap-2.5 ${className}`}>
    {icon}
    <span>{children}</span>
  </span>
);

export default function SettingsMenu({ onNavigate }) {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const toast = useToast();
  const { refresh } = useHistory();
  const roughbooks = useRoughbooks();

  const [menu, setMenu] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const openProfile = () => {
    setMenu(null);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("profile", "1");
      return next;
    });
    onNavigate?.();
  };

  const askChange = () => {
    setMenu(null);
    setError(null);
    setConfirming(true);
  };

  const signOut = () => {
    setConfirmSignOut(false);
    authClient.signOut({ fetchOptions: { onSuccess: () => navigate("/login") } });
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
          <MenuItem onClick={openProfile}>
            <Label icon={SETTINGS_ICONS.profile}>Profile</Label>
          </MenuItem>
          <MenuItem onClick={askChange}>
            <Label icon={SETTINGS_ICONS.edit}>Change user details</Label>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenu(null);
              setConfirmSignOut(true);
            }}
          >
            <Label icon={SETTINGS_ICONS.logout} className="text-red-400">Sign out</Label>
          </MenuItem>
        </PopoverMenu>
      )}

      {confirming && (
        <ConfirmDialog
          heading="Change user details?"
          message={CHANGE_DETAILS_TEXT}
          confirmLabel="Clear and continue"
          delaySeconds={5}
          mustScroll
          busy={busy}
          error={error}
          onConfirm={confirmChange}
          onCancel={() => setConfirming(false)}
        />
      )}

      {confirmSignOut && (
        <ConfirmDialog
          heading="Sign out?"
          message="You will need to sign in with Google again to get back in."
          confirmLabel="Sign out"
          onConfirm={signOut}
          onCancel={() => setConfirmSignOut(false)}
        />
      )}
    </>
  );
}