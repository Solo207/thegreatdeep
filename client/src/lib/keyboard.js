export const FOCUS_EVENT = "chat-input:focus";

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

// Ask the chat box on /new to take focus (which opens the phone keyboard).
// Call it straight from a tap handler, because phones only allow it then.
export function requestChatFocus() {
  window.dispatchEvent(new Event(FOCUS_EVENT));
}

// For a tap that goes to a page that isn't open yet (New chat from another page).
// Phones only open the keyboard for a focus that happens inside the tap, so a hidden
// field takes focus now, and the /new box takes it over a moment later.
export function warmUpKeyboard() {
  if (!isTouch()) return;
  document.getElementById("keyboard-bridge")?.focus();
}