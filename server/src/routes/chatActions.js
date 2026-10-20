import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n, actionN8n } from "../lib/n8n.js";
import { RB_ID_RE } from "../lib/ids.js";
import { cut, fail } from "./pq.js";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// the user details every webhook gets, taken from the signed-in session
const userOf = (req) => ({
  user_id: req.user.id,
  email: req.user.email,
  user_name: req.user.name,
});

// chats as the list webhooks answer them: [{ id, title, date, rough, rough_id, pin }]
function chatsFrom(data, max, { pin = null } = {}) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.chats) ? data.chats : [];
  return list
    .filter((c) => UUID_RE.test(c?.id))
    .map((c) => ({
      id: c.id,
      title: String(c.title ?? ""),
      date: String(c.date ?? ""),
      rough: typeof c.rough === "string" ? c.rough.slice(0, 100) : "",
      // the roughbook is identified by its id; the name is only for display
      roughId: typeof c.rough_id === "string" && RB_ID_RE.test(c.rough_id) ? c.rough_id : "",
      pin: pin ?? c.pin === true,
    }))
    .slice(0, max);
}

// pinned chats (an empty answer means none)
router.get("/pinned", requireAuth, async (req, res) => {
  try {
    const data = await callN8n("pinned", userOf(req));
    res.json({ chats: chatsFrom(data, 100, { pin: true }) });
  } catch (err) {
    fail(res, err);
  }
});

// every chat, for the /chats page
router.get("/all", requireAuth, async (req, res) => {
  try {
    const data = await callN8n("all_chats", userOf(req));
    res.json({ chats: chatsFrom(data, 5000) });
  } catch (err) {
    fail(res, err);
  }
});

// delete one or many chats: chat_ids is always an array
router.post("/delete", requireAuth, async (req, res) => {
  const ids = Array.isArray(req.body?.chatIds) ? req.body.chatIds : [];
  if (ids.length === 0 || ids.length > 500) {
    return res.status(400).json({ error: "Invalid request" });
  }
  if (!ids.every((id) => typeof id === "string" && UUID_RE.test(id))) {
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    await actionN8n("delete", { chat_ids: [...new Set(ids)], ...userOf(req) });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

// pin or unpin
router.post("/:chatId/pin", requireAuth, async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  try {
    await actionN8n("pin", {
      chat_id: chatId,
      do_what: req.body?.pin === false ? "unpin" : "pin",
      ...userOf(req),
    });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

// rename
router.post("/:chatId/rename", requireAuth, async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  const name = cut(req.body?.name, 100).replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!name) return res.status(400).json({ error: "Missing name" });
  try {
    await actionN8n("rename", { chat_id: chatId, name, ...userOf(req) });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

// put a chat into a roughbook (also used to move it to another one)
router.post("/:chatId/rough", requireAuth, async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  const roughId = cut(req.body?.roughId, 100);
  const roughName = cut(req.body?.roughName, 100);
  if (!RB_ID_RE.test(roughId) || !roughName) {
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    await actionN8n("addchatrb", {
      chat_id: chatId,
      rough_id: roughId,
      rough_name: roughName,
      ...userOf(req),
    });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

// take a chat out of its roughbook (matched by id; the name is sent along too)
router.post("/:chatId/rough/remove", requireAuth, async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  const roughId = cut(req.body?.roughId, 100);
  const roughName = cut(req.body?.roughName, 100);
  const hasId = RB_ID_RE.test(roughId);
  if (!hasId && !roughName) return res.status(400).json({ error: "Invalid request" });
  try {
    await actionN8n("rmrb", {
      chat_id: chatId,
      rough_id: hasId ? roughId : undefined,
      rough_name: roughName || undefined,
      ...userOf(req),
    });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

export default router;