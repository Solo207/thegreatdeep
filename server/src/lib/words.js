const clean = (v) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 40) : "";

const ID_RE = /^[\w-]{1,100}$/;

/** The status words n8n sends straight after /chat-message. */
export function wordsFrom(data) {
  const first = Array.isArray(data) ? data[0] : data;
  let raw = [];
  if (Array.isArray(first?.words)) {
    raw = first.words; // [{ "words": ["Mulling", "Processing", "Writing"] }]
  } else if (Array.isArray(data) && data.every((d) => d && typeof d.text === "string")) {
    raw = data.map((d) => d.text); // the old shape: [{ "text": "Mulling" }, …]
  } else if (Array.isArray(data) && data.every((d) => typeof d === "string")) {
    raw = data; // ["Mulling", …]
  }
  return raw.map(clean).filter(Boolean).slice(0, 10);
}

/** The id of the user's message, when n8n sends it along with the words. */
export function messageIdFrom(data) {
  const first = Array.isArray(data) ? data[0] : data;
  const raw = first?.id;
  const id = typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
  return ID_RE.test(id) ? id : null;
}