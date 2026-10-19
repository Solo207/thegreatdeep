// the main text of a message, whatever shape it has
export function bodyOf(message) {
  const c = message?.content;
  return typeof c === "string" ? c : c?.body ?? "";
}

// ALL the text a message shows, as plain text (for copying): the main text plus
// button labels, list options, links, questions and document names.
export function messageToText(message) {
  const c = message?.content;
  if (typeof c === "string") return c;
  if (!c) return "";

  const lines = [];
  if (c.body) lines.push(c.body);

  switch (message.type) {
    case "buttons":
      (c.buttons ?? []).forEach((b) => lines.push(`• ${b.label}`));
      break;
    case "list":
      (c.sections ?? []).forEach((s) => {
        if (s.title) lines.push(s.title);
        (s.rows ?? []).forEach((r) =>
          lines.push(`• ${r.title}${r.description ? `: ${r.description}` : ""}`)
        );
      });
      break;
    case "links":
      (c.links ?? []).forEach((l) => lines.push(`${l.label}: ${l.url}`));
      break;
    case "qa":
      (c.questions ?? []).forEach((q, i) => {
        lines.push(`${i + 1}. ${q.text}`);
        (q.options ?? []).forEach((o) => lines.push(`   • ${o.label}`));
      });
      break;
    case "docs":
      if (c.link) lines.push(c.link);
      break;
    default:
      break;
  }
  return lines.join("\n");
}