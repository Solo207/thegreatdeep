/** Scrolls the chat to one of the user's questions. */
export function jumpToMessage(id, index) {
  const byId = id ? document.querySelector(`[data-message-id="${CSS.escape(id)}"]`) : null;
  // a message sent in this visit has a temporary id on the page, so fall back to its place among the questions
  const el = byId ?? document.querySelectorAll("[data-user-message]")[index];
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}