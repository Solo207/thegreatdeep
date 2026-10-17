import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n } from "../lib/n8n.js";
import { RB_ID_RE } from "../lib/ids.js";
import { cut, fail } from "./pq.js";

const router = Router();
router.use(requireAuth);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// the user details every webhook gets, taken from the signed-in session
const userOf = (req) => ({
  user_id: req.user.id,
  email: req.user.email,
  user_name: req.user.name,
});

// 1. the roughbooks of this user: [{ id, title, last_updated }]
router.get("/", async (req, res) => {
  try {
    const data = await callN8n("rb", userOf(req));
    const list = Array.isArray(data) ? data : Array.isArray(data?.books) ? data.books : [];
    const books = list
      .map((b) => ({
        id: cut(b?.id, 100),
        title: cut(b?.title, 100),
        last_updated: cut(b?.last_updated, 60),
      }))
      .filter((b) => RB_ID_RE.test(b.id) && b.title)
      .slice(0, 200);
    res.json({ books });
  } catch (err) {
    fail(res, err);
  }
});

// 2. a new roughbook: n8n answers { id }
router.post("/", async (req, res) => {
   // letters, numbers and single spaces only, at most 30 characters
  const name = cut(req.body?.name, 200)
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/ {2,}/g, " ")
    .trim()
    .slice(0, 30);
  if (!name) return res.status(400).json({ error: "Missing name" });
  try {
    const data = await callN8n("newrb", { rb_name: name, ...userOf(req) });
    const first = Array.isArray(data) ? data[0] : data;
    const id = cut(typeof first === "string" ? first : first?.id, 100);
    if (!RB_ID_RE.test(id)) return res.status(502).json({ error: "No id" });
    res.json({ id });
  } catch (err) {
    fail(res, err);
  }
});

// 3. the chats inside one roughbook: [{ id, title, date }]
router.get("/:rbId/chats", async (req, res) => {
  const { rbId } = req.params;
  if (!RB_ID_RE.test(rbId)) return res.status(404).json({ error: "Not found" });
  try {
    const data = await callN8n("rbhistory", { rb_id: rbId, ...userOf(req) });
    const list = Array.isArray(data) ? data : Array.isArray(data?.chats) ? data.chats : [];
    const chats = list
      .filter((c) => UUID_RE.test(c?.id))
      .map((c) => ({ id: c.id, title: cut(c.title, 200), date: cut(c.date, 60) }))
      .slice(0, 500);
    res.json({ chats });
  } catch (err) {
    fail(res, err);
  }
});

export default router;