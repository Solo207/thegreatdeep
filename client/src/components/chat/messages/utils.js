// the text of a message, whatever shape it has
export function bodyOf(message) {
  const c = message?.content;
  return typeof c === "string" ? c : c?.body ?? "";
}