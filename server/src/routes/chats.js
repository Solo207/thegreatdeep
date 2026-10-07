import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n } from "../lib/n8n.js";
import {
  markPending,
  setPendingWords,
  clearPending,
  getPending,
} from "../lib/pending.js";
import { normalizeMessage } from "../lib/messages.js";

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

function fail(res, err) {
  console.error("chat error:", err.message);
  if (err.status === 404) return res.status(404).json({ error: "Not found" });
  if (err.name === "TimeoutError") return res.status(504).json({ error: "Timed out" });
  return res.status(502).json({ error: "Something went wrong" });
}

// 1. create a chat
router.post("/", async (req, res) => {
  console.log("create chat requested by", req.user.id);   // <-- add this
  try {
    const data = await callN8n("chat-create", { userId: req.user.id });
    if (!UUID_RE.test(data?.chatId)) throw new Error("n8n returned a bad chatId");
    res.status(201).json({ id: data.chatId });
  } catch (err) {
    fail(res, err);
  }
});

// 0. list chats (sidebar and /chats page)
router.get("/", async (req, res) => {
  const all = req.query.all === "true";
  try {
    const data = await callN8n("get-history", { userId: req.user.id, all });
    const items = Array.isArray(data) ? data : [];
    res.json({
      chats: items
        .filter((c) => UUID_RE.test(c?.id))
        .map((c) => ({
          id: c.id,
          title: String(c.title ?? ""),
          date: String(c.date ?? ""),
        })),
      hasMore: !all && items.some((c) => c?.id === "show_more"),
    });
  } catch (err) {
    fail(res, err);
  }
});

// 2. load a chat
router.get("/:chatId", async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  try {
    const data = await callN8n("chat-get", { userId: req.user.id, chatId });
    const waiting = getPending(req.user.id, chatId);
    res.json({
      chat: { id: data.chat.id, title: data.chat.title },
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
      userId,
      chatId,
      message: content.trim(),
      selection, // null unless the user tapped a button or list row
      callbackUrl: process.env.PUBLIC_BASE_URL
        ? `${process.env.PUBLIC_BASE_URL}/api/internal/messages`
        : undefined,
    });

    if (data?.message) {
      // old synchronous workflow: the reply is already here, nothing to wait for
      clearPending(userId, chatId);
      const normalized = normalizeMessage(data.message);
      if (!normalized) throw new Error("n8n returned an unusable message");
      return res.status(201).json({ message: normalized });
    }

    const words = cleanWords(data);
    setPendingWords(userId, chatId, words);
    res.status(202).json({ words });
  } catch (err) {
    clearPending(userId, chatId);
    fail(res, err);
  }
});

export default router;