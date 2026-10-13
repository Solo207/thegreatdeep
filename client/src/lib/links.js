// finds web addresses (http://, https://, www.) in plain text
const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;

// removes punctuation that belongs to the sentence, not to the address
function trimTrailing(raw) {
  let url = raw;
  while (/[.,;:!?)\]}]$/.test(url)) {
    if (url.endsWith(")")) {
      // keep a closing bracket the address opened, e.g. .../Aspirin_(drug)
      const opens = (url.match(/\(/g) || []).length;
      const closes = (url.match(/\)/g) || []).length;
      if (opens >= closes) break;
    }
    url = url.slice(0, -1);
  }
  return url;
}

// the address as a safe link, or null if it isn't a normal web address
export function hrefFor(url) {
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const u = new URL(withProtocol);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname || u.hostname.endsWith(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// Splits text into plain pieces and web addresses:
// [{ text }, { text, href }, { text }, ...]
export function splitLinks(text) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    const url = trimTrailing(match[0]);
    const href = hrefFor(url);
    if (!href) continue; // not a real address: leave it as plain text
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: url, href });
    last = match.index + url.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}