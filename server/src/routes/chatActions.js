import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n, actionN8n } from "../lib/n8n.js";
import { RB_ID_RE } from "../lib/ids.js";
import { userDetails } from "../lib/user.js";
import { cleanDetail, cleanOptions } from "../lib/detail.js";
import { cut, fail } from "./pq.js";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// chats as the list webhooks answer them: [{ id, title, date, rough, rough_id, pin }]
// (rbName / rbId are accepted in place of rough / rough_id)
function chatsFrom(data, max, { pin = null } = {}) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.chats) ? data.chats : [];
  return list
    .filter((c) => UUID_RE.test(c?.id))
    .map((c) => {
      const rough = c.rough ?? c.rbName;
      const roughId = c.rough_id ?? c.rbId;
      return {
        id: c.id,
        title: String(c.title ?? ""),
        date: String(c.date ?? ""),
        rough: typeof rough === "string" ? rough.slice(0, 100) : "",
        // the roughbook is identified by its id; the name is only for display
        roughId: typeof roughId === "string" && RB_ID_RE.test(roughId) ? roughId : "",
        pin: pin ?? c.pin === true,
      };
    })
    .slice(0, max);
}

// pinned chats (an empty answer means none)
router.get("/pinned", requireAuth, async (req, res) => {
  try {
    const data = await callN8n("pinned", userDetails(req));
    res.json({ chats: chatsFrom(data, 100, { pin: true }) });
  } catch (err) {
    fail(res, err);
  }
});

// every chat, for the /chats page
router.get("/all", requireAuth, async (req, res) => {
  try {
    const data = await callN8n("all_chats", userDetails(req));
    res.json({ chats: chatsFrom(data, 5000) });
  } catch (err) {
    fail(res, err);
  }
});

// the default detail settings, for a chat that doesn't exist yet
router.get("/detail", requireAuth, async (req, res) => {
  try {
    const data = await callN8n("detail", { ...userDetails(req), type: "get" });
    res.json(cleanDetail(data));
  } catch (err) {
    fail(res, err);
  }
});

// delete one or many chats: chatIds is always an array
router.post("/delete", requireAuth, async (req, res) => {
  const ids = Array.isArray(req.body?.chatIds) ? req.body.chatIds : [];
  if (ids.length === 0 || ids.length > 500) {
    return res.status(400).json({ error: "Invalid request" });
  }
  if (!ids.every((id) => typeof id === "string" && UUID_RE.test(id))) {
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    await actionN8n("delete", { ...userDetails(req), chatIds: [...new Set(ids)] });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

// detail settings of one chat
router.get("/:chatId/detail", requireAuth, async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  try {
    const data = await callN8n("detail", { ...userDetails(req), chatId, type: "get" });
    res.json(cleanDetail(data));
  } catch (err) {
    fail(res, err);
  }
});

router.post("/:chatId/detail", requireAuth, async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  try {
    await actionN8n("detail", {
      ...cleanOptions(req.body),
      ...userDetails(req),
      chatId,
      type: "edit",
    });
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
      ...userDetails(req),
      chatId,
      doWhat: req.body?.pin === false ? "unpin" : "pin",
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
    await actionN8n("rename", { ...userDetails(req), chatId, name });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

// put a chat into a roughbook (also used to move it to another one)
router.post("/:chatId/rough", requireAuth, async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  const rbId = cut(req.body?.roughId, 100);
  const rbName = cut(req.body?.roughName, 100);
  if (!RB_ID_RE.test(rbId) || !rbName) {
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    await actionN8n("addchatrb", { ...userDetails(req), chatId, rbId, rbName });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

// take a chat out of its roughbook (matched by id; the name is sent along too)
router.post("/:chatId/rough/remove", requireAuth, async (req, res) => {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) return res.status(404).json({ error: "Not found" });
  const rbId = cut(req.body?.roughId, 100);
  const rbName = cut(req.body?.roughName, 100);
  const hasId = RB_ID_RE.test(rbId);
  if (!hasId && !rbName) return res.status(400).json({ error: "Invalid request" });
  try {
    await actionN8n("rmrb", {
      ...userDetails(req),
      chatId,
      rbId: hasId ? rbId : undefined,
      rbName: rbName || undefined,
    });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

export default router;