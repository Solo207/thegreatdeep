/** Scrolls the chat to one of the user's questions, found by its id. */
export function jumpToMessage(id) {
  const el = id ? document.querySelector(`[data-message-id="${CSS.escape(id)}"]`) : null;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}