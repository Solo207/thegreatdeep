import { safeUrl } from "./messages.js";

// Every request to n8n goes to ONE webhook: /SMCE.
// The old webhook name travels inside the request as "query" (for example "/delete"),
// and n8n routes by it.
const ENTRY = "SMCE";

function entryUrl() {
  const prefix = process.env.N8N_WEBHOOK_PREFIX || "webhook";
  return `${process.env.N8N_BASE_URL}/${prefix}/${ENTRY}`;
}

const headers = () => ({
  "Content-Type": "application/json",
  "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET,
});

const bodyFor = (name, payload) => JSON.stringify({ ...payload, query: `/${name}` });

function parse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// n8n can answer { role: "system", content: [{ type: "link", text: "https://…" }] },
// which means: send the user to that link. (Punctuation in "role" is ignored.)
export function systemLink(data) {
  const msg = Array.isArray(data) ? data[0] : data;
  if (!msg || typeof msg !== "object") return null;
  const role = String(msg.role ?? "").replace(/[^a-z]/gi, "").toLowerCase();
  if (role !== "system") return null;
  const parts = Array.isArray(msg.content) ? msg.content : [];
  const item = parts.find((p) => p?.type === "link" && typeof p.text === "string");
  return item ? safeUrl(item.text.trim()) : null;
}

// thrown when n8n asks for a redirect; the routes' error handler turns it into { redirect }
class RedirectError extends Error {
  constructor(url) {
    super("n8n asked for a redirect");
    this.redirect = url;
  }
}

function problem(status) {
  const err = new Error(status === 404 ? "Not found" : `n8n responded ${status}`);
  err.status = status === 404 ? 404 : 502;
  return err;
}

// Ask n8n and use its answer.
export async function callN8n(name, payload) {
  const res = await fetch(entryUrl(), {
    method: "POST",
    headers: headers(),
    body: bodyFor(name, payload),
    signal: AbortSignal.timeout(90_000),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`[n8n ${name}] answered ${res.status}: ${text.slice(0, 200)}`);
    throw problem(res.status);
  }
  const data = parse(text);
  const url = systemLink(data);
  if (url) throw new RedirectError(url);
  return data;
}

// For actions where only "did it work?" matters (delete, pin, rename...):
// any 2xx answer counts as success, whatever the body looks like.
export async function actionN8n(name, payload) {
  const res = await fetch(entryUrl(), {
    method: "POST",
    headers: headers(),
    body: bodyFor(name, payload),
    signal: AbortSignal.timeout(90_000),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`[n8n ${name}] answered ${res.status}: ${text.slice(0, 200)}`);
    throw problem(res.status);
  }
  const url = systemLink(parse(text));
  if (url) throw new RedirectError(url);
}

// Ask n8n and hand back the raw response, for files that are streamed on to the browser.
export async function getN8nFile(name, params, signal) {
  const res = await fetch(entryUrl(), {
    method: "POST",
    headers: headers(),
    body: bodyFor(name, params),
    signal,
  });
  if (!res.ok) {
    console.error(`[n8n ${name}] answered ${res.status}`);
    throw problem(res.status);
  }
  return res;
}