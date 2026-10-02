import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n } from "../lib/n8n.js";

const router = Router();
router.use(requireAuth);

const MAX_LEN = 4000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidText = (t) =>
  typeof t === "string" && t.trim().length > 0 && t.length <= MAX_LEN;

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
    res.json({
      chat: { id: data.chat.id, title: data.chat.title },
      messages: (data.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
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

  try {
    const data = await callN8n("chat-message", {
      userId: req.user.id,
      chatId,
      message: content.trim(),
    });
    const m = data.message;
    res.status(201).json({
      message: { id: m.id, role: m.role, content: m.content, createdAt: m.createdAt },
    });
  } catch (err) {
    fail(res, err);
  }
});

export default router;