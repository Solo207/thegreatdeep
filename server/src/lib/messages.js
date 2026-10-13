import crypto from "crypto";

const TYPES = ["text", "buttons", "list", "links", "qa", "docs"];
const MAX_BODY = 30_000;

const cut = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const hasText = (v) => typeof v === "string" && v.trim().length > 0;


// content may arrive as an object, a JSON string, or (old messages) a plain string
function parseContent(type, content) {
  if (typeof content === "string") {
    if (type !== "text") {
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        /* not JSON: treat as plain text below */
      }
    }
    return { body: content };
  }
  return content && typeof content === "object" ? content : {};
}

// only normal web links: blocks javascript: and similar tricks
export function safeUrl(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// -> { id, role, type, content, createdAt }, or null if there is nothing usable
export function normalizeMessage(raw) {
  if (!raw || (raw.role !== "user" && raw.role !== "assistant")) return null;

  let type = TYPES.includes(raw.type) ? raw.type : "text";
  const c = parseContent(type, raw.content);
  const body = cut(c.body, MAX_BODY);
  let content = { body };

  if (type === "buttons") {
    const buttons = (Array.isArray(c.buttons) ? c.buttons : [])
      .filter((b) => hasText(b?.id) && hasText(b?.label))
      .slice(0, 10)
      .map((b) => ({ id: b.id.slice(0, 100), label: b.label.trim().slice(0, 60) }));
    if (buttons.length > 0) content = { body, buttons };
    else type = "text";
  } else if (type === "list") {
    const sections = (Array.isArray(c.sections) ? c.sections : [])
      .slice(0, 10)
      .map((s) => ({
        title: cut(s?.title, 60),
        rows: (Array.isArray(s?.rows) ? s.rows : [])
          .filter((r) => hasText(r?.id) && hasText(r?.title))
          .slice(0, 50)
          .map((r) => ({
            id: r.id.slice(0, 100),
            title: r.title.trim().slice(0, 80),
            description: cut(r.description, 200),
          })),
      }))
      .filter((s) => s.rows.length > 0);
    if (sections.length > 0) {
      content = { body, buttonLabel: cut(c.buttonLabel, 40) || "Choose", sections };
    } else type = "text";
  } else if (type === "links") {
    const links = (Array.isArray(c.links) ? c.links : [])
      .map((l) => ({ id: cut(l?.id, 100), label: cut(l?.label, 60).trim(), url: safeUrl(l?.url) }))
      .filter((l) => l.label && l.url)
      .slice(0, 10)
      .map((l, i) => ({ ...l, id: l.id || `link_${i + 1}` }));
    if (links.length > 0) content = { body, links };
    else type = "text";
  } else if (type === "qa") {
    const seenQ = new Set();
    const questions = (Array.isArray(c.questions) ? c.questions : [])
      .slice(0, 10)
      .map((q, qi) => {
        // ids must be unique inside a message, so repeats get a suffix
        let qid = cut(q?.id, 100) || `q${qi + 1}`;
        if (seenQ.has(qid)) qid = `${qid}_${qi + 1}`;
        seenQ.add(qid);

        const seenO = new Set();
        const options = (Array.isArray(q?.options) ? q.options : [])
          .filter((o) => hasText(o?.id) && hasText(o?.label))
          .slice(0, 10)
          .map((o, oi) => {
            let oid = o.id.slice(0, 100);
            if (seenO.has(oid)) oid = `${oid}_${oi + 1}`;
            seenO.add(oid);
            return {
              id: oid,
              kind: o.kind === "input" ? "input" : "choice",
              label: o.label.trim().slice(0, 120),
            };
          });
        return { id: qid, text: cut(q?.text, 500).trim(), options };
      })
      .filter((q) => q.text && q.options.length > 0);
    if (questions.length > 0) content = { body, questions };
    else type = "text";
  } else if (type === "docs") {
    const label = cut(c.body, 200).trim();
    // the file type is only letters and digits, shown as a small badge (pptx, pdf, docx…)
    const filetype = cut(c.filetype, 10).toLowerCase().replace(/[^a-z0-9]/g, "");
    const link = c.link ? safeUrl(cut(c.link, 2000)) ?? "" : "";
    if (label || filetype) content = { body: label, filetype, link };
    else type = "text";
  }

  if (type === "text" && !body.trim()) return null;

  return {
    id:
      typeof raw.id === "string" && raw.id.length > 0 && raw.id.length <= 100
        ? raw.id
        : crypto.randomUUID(),
    role: raw.role,
    type,
    content,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}