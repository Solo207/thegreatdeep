export const FOCUS_EVENT = "chat-input:focus";

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

// True while something (e.g. the profile panel) has set data-no-chat-focus on <html>.
export const chatFocusBlocked = () =>
  document.documentElement.hasAttribute("data-no-chat-focus");

// Ask the chat box on /new to take focus (which opens the phone keyboard).
// Call it straight from a tap handler, because phones only allow it then.
export function requestChatFocus() {
  if (chatFocusBlocked()) return;
  window.dispatchEvent(new Event(FOCUS_EVENT));
}

// For a tap that goes to a page that isn't open yet (New chat from another page).
// Phones only open the keyboard for a focus that happens inside the tap, so a hidden
// field takes focus now, and the /new box takes it over a moment later.
export function warmUpKeyboard() {
  if (chatFocusBlocked()) return;
  if (!isTouch()) return;
  document.getElementById("keyboard-bridge")?.focus();
}

// Closes the phone keyboard (whatever field has focus lets go).
export function closeKeyboard() {
  const el = document.activeElement;
  if (el instanceof HTMLElement) el.blur();
}