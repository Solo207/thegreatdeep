import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n, actionN8n } from "../lib/n8n.js";
import { RB_ID_RE } from "../lib/ids.js";
import { userDetails } from "../lib/user.js";
import { cleanDetail, cleanOptions } from "../lib/detail.js";
import { cut, fail } from "./pq.js";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// chatsFrom(...) stays exactly as it is

// pinned chats (an empty answer means none)
router.get("/pinned", requireAuth, async (req, res) => {
  /* unchanged */
});

// every chat, for the /chats page
router.get("/all", requireAuth, async (req, res) => {
  /* unchanged */
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
  /* unchanged */
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

// pin, rename, rough, rough/remove: unchanged

export default router;