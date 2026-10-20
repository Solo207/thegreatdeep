import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n, actionN8n } from "../lib/n8n.js";
import { userDetails } from "../lib/user.js";
import { cut, fail, linkFrom, groupsFrom } from "./pq.js";

const router = Router();
router.use(requireAuth);

// 1. the page loads: the subjects that have bookmarks
router.get("/subjects", async (req, res) => {
  try {
    const data = await callN8n("bm", userDetails(req));
    const list = Array.isArray(data) ? data : Array.isArray(data?.subjects) ? data.subjects : [];
    const subjects = list
      .map((s) => cut(typeof s === "string" ? s : s?.name ?? s?.subject ?? s?.title, 100))
      .filter(Boolean)
      .slice(0, 100);
    res.json({ subjects });
  } catch (err) {
    fail(res, err);
  }
});

// 2. a subject was tapped: its bookmarks, grouped by class
router.post("/papers", async (req, res) => {
  const subject = cut(req.body?.subject, 100);
  if (!subject) return res.status(400).json({ error: "Missing subject" });
  try {
    const data = await callN8n("get_bm", { ...userDetails(req), button: subject });
    res.json({ groups: groupsFrom(data) });
  } catch (err) {
    fail(res, err);
  }
});

// 3. the delete icon was tapped and confirmed
router.post("/delete", async (req, res) => {
  const code = cut(req.body?.code, 200);
  const title = cut(req.body?.title, 200);
  if (!code || !title) return res.status(400).json({ error: "Invalid request" });
  try {
    await actionN8n("bm_del", { ...userDetails(req), code, title });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

// 4. a bookmark was chosen (with or without a timer): n8n answers with a link
router.post("/start", async (req, res) => {
  const code = cut(req.body?.code, 200);
  const title = cut(req.body?.title, 200);
  const time = Number(req.body?.time);
  if (!code || !title || !Number.isInteger(time) || time < 0 || time > 150) {
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    const data = await callN8n("bm_link", { ...userDetails(req), time, code, title });
    const link = linkFrom(data);
    if (!link) return res.status(502).json({ error: "No link" });
    res.json({ link });
  } catch (err) {
    fail(res, err);
  }
});

export default router;