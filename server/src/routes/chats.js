import { Router } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n, getN8nFile, systemLink } from "../lib/n8n.js";
import { normalizeMessage, safeUrl } from "../lib/messages.js";
import { RB_ID_RE } from "../lib/ids.js";
import { userDetails } from "../lib/user.js";
import {
  markPending,
  setPendingWords,
  clearPending,
  getPending,
} from "../lib/pending.js";
import { cleanOptions, hasOptions } from "../lib/detail.js";
import { wordsFrom } from "../lib/words.js";
import { neighbor, cleanId } from "../lib/neighbors.js";

const router = Router();
router.use(requireAuth);

const MAX_LEN = 4000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidText = (t) =>
 typeof t === "string" && t.trim().length > 0 && t.length <= MAX_LEN;

// n8n may answer at once with status words like [{ "text": "Mulling" }, { "text": "Processing" }]
function cleanWords(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.words)
    ? data.words
    : [];
  return list
    .map((w) => (typeof w === "string" ? w : w?.text))
    .filter((w) => typeof w === "string" && w.trim())
    .map((w) => w.trim().slice(0, 40))
    .slice(0, 10);
}

// what the user tapped or answered (the readable version is sent as the message text)
function cleanSelection(s) {
  if (!s || typeof s !== "object") return null;
  const messageId =
    typeof s.messageId === "string" && s.messageId.length <= 100 ? s.messageId : null;

  if (s.source === "qa") {
    const answers = (Array.isArray(s.answers) ? s.answers : [])
      .slice(0, 10)
      .map((a) => ({
        questionId: typeof a?.questionId === "string" ? a.questionId.slice(0, 100) : "",
        optionId: typeof a?.optionId === "string" ? a.optionId.slice(0, 100) : "",
        kind: a?.kind === "input" ? "input" : "choice",
        text: typeof a?.text === "string" ? a.text.slice(0, 1000) : undefined,
      }))
      .filter((a) => a.questionId && a.optionId);
    return answers.length > 0 ? { source: "qa", messageId, answers } : null;
  }

  if (typeof s.id !== "string" || !s.id || s.id.length > 100) return null;
  if (s.source !== "buttons" && s.source !== "list") return null;
  return { id: s.id, source: s.source, messageId };
}

// A file name that is safe to put in a header: plain characters only
function safeFileName(name, filetype) {
  const ext =
    typeof filetype === "string"
      ? filetype.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)
      : "";
  let base =
    typeof name === "string"
      ? name.replace(/[^A-Za-z0-9 ._()-]/g, "").trim().slice(0, 100)
      : "";
  if (!base) base = "document";
  return ext && !base.toLowerCase().endsWith(`.${ext}`) ? `${base}.${ext}` : base;
}

function fail(res, err) {
  // n8n asked: send the user to this link
  if (err.redirect) return res.json({ redirect: err.redirect });
  console.error("chat error:", err.message);
  if (err.status === 404) return res.status(404).json({ error: "Not found" });
  if (err.name === "TimeoutError") return res.status(504).json({ error: "Timed out" });
  return res.status(502).json({ error: "Something went wrong" });
}

// 0. the latest chats for the sidebar (get-history answers 20, plus a "show_more" item if there are more)
router.get("/", async (req, res) => {
  try {
    const data = await callN8n("get-history", userDetails(req));
    const items = Array.isArray(data) ? data : [];
    res.json({
      chats: items
        .filter((c) => UUID_RE.test(c?.id))
        .map((c) => {
          const rough = c.rough ?? c.rbName;
          const roughId = c.rough_id ?? c.rbId;
          return {
            id: c.id,
            title: String(c.title ?? ""),
            date: String(c.date ?? ""),
            rough: typeof rough === "string" ? rough.slice(0, 100) : "",
            roughId: typeof roughId === "string" && RB_ID_RE.test(roughId) ? roughId : "",
            pin: c.pin === true,
          };
        }),
      hasMore: items.some((c) => c?.id === "show_more"),
    });
  } catch (err) {
    fail(res, err);
  }
});

// 1. create a chat (inside a roughbook when "rb" is given)
router.post("/", async (req, res) => {
  const rb = typeof req.body?.rb === "string" ? req.body.rb.trim() : "";
  if (rb && !RB_ID_RE.test(rb)) return res.status(400).json({ error: "Invalid roughbook" });
  try {
    const data = await callN8n("chat-create", { ...userDetails(req), rbId: rb || undefined });
    if (!UUID_RE.test(data?.chatId)) throw new Error("n8n returned a bad chatId");
    res.status(201).json({ id: data.chatId });
  } catch (err) {
    fail(res, err);
  }
});

// 2. load a chat
router.get("/:chatId", async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  try {
    const data = await callN8n("chat-get", { ...userDetails(req), chatId });
    // the answer is { id, title, rough?, messages }
    const chat = data?.chat ?? data;
    if (!chat || typeof chat !== "object") throw new Error("n8n returned no chat");
    const rough = chat.rough ?? data?.rough ?? chat.rbName;
    const waiting = getPending(req.user.id, chatId);
    res.json({
      chat: {
        id: chat.id ?? chatId,
        title: chat.title,
        rough: typeof rough === "string" ? rough.slice(0, 100) : "",
      },
      messages: (data.messages ?? []).map(normalizeMessage).filter(Boolean),
      // not null while n8n is still working on this chat
      pending: waiting ? { words: waiting.words } : null,
    });
  } catch (err) {
    fail(res, err);
  }
});

// 3. send a message
router.post("/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });

  const { content } = req.body ?? {};
  if (!isValidText(content)) return res.status(400).json({ error: "Invalid message" });
  const selection = cleanSelection(req.body?.selection);

  const userId = req.user.id;
  markPending(userId, chatId); // marked BEFORE calling n8n so a very fast "done" can't be missed

  try {
    const data = await callN8n("chat-message", {
      ...userDetails(req),
      chatId,
      messageId: cleanId(req.body?.messageId),
      message: content.trim(),
      selection, // null unless the user tapped a button or list row
      callbackUrl: process.env.PUBLIC_BASE_URL
        ? `${process.env.PUBLIC_BASE_URL}/api/internal/messages`
        : undefined,
      ...(hasOptions(req.body) ? cleanOptions(req.body) : {}),
      above: neighbor(req.body?.above),
      below: neighbor(req.body?.below),
    });

    if (data?.message) {
      // old synchronous workflow: the reply is already here, nothing to wait for
      clearPending(userId, chatId);
      const normalized = normalizeMessage(data.message);
      if (!normalized) throw new Error("n8n returned an unusable message");
      return res.status(201).json({ message: normalized });
    }

    const found = wordsFrom(data);
    const words = found.length ? found : ["Thinking"];
    setPendingWords(userId, chatId, words);
    res.status(202).json({ words });
  } catch (err) {
    clearPending(userId, chatId);
    fail(res, err);
  }
});

// 4. a document button was tapped: n8n's workflow produces the file and it is
// streamed on to the browser, which downloads it. Nothing is sent to the chat.
router.get("/:chatId/docs/:messageId", async (req, res) => {
  const { chatId, messageId } = req.params;
  if (!UUID_RE.test(chatId) || !UUID_RE.test(messageId)) {
    return res.status(404).json({ error: "Not found" });
  }

  // the link the message carries: optional, but if present it must be a normal web link
  const rawLink = typeof req.query.link === "string" ? req.query.link : "";
  const link = rawLink ? (rawLink.length <= 2000 ? safeUrl(rawLink) : null) : "";
  if (link === null) return res.status(400).json({ error: "Bad link" });

  const fileName = safeFileName(req.query.name, req.query.filetype);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000); // waiting for n8n to start answering
  res.on("close", () => controller.abort()); // the browser gave up, so stop asking n8n

 try {
  const upstream = await getN8nFile(
    "docs",
    {
      ...userDetails(req),
      chatId,
      messageId,
      link: link || undefined,
      above: neighbor(req.query.above),
      below: neighbor(req.query.below),
    },
    controller.signal
  );
  clearTimeout(timer);
    // n8n did not send a file: it may be asking for a redirect
    const type = upstream.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      const text = await upstream.text().catch(() => "");
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* not JSON */
      }
      const url = systemLink(data);
      if (url) return res.json({ redirect: url });
      return res.status(502).json({ error: "Not a file" });
    }

    // always a download, never shown inside the page
    const disposition = upstream.headers.get("content-disposition") || "";
    res.set({
      "Content-Type": type || "application/octet-stream",
      "Content-Disposition": /^attachment/i.test(disposition)
        ? disposition
        : `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    });
    const length = upstream.headers.get("content-length");
    if (length && !upstream.headers.get("content-encoding")) res.set("Content-Length", length);

    if (!upstream.body) return res.end();
    await pipeline(Readable.fromWeb(upstream.body), res); // streams the file, never held in memory
  } catch (err) {
    clearTimeout(timer);
    if (res.headersSent) {
      res.destroy(); // already streaming: just stop
      return;
    }
    if (err.name === "AbortError") return res.status(504).json({ error: "Timed out" });
    fail(res, err);
  }
});

export default router;