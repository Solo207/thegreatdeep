import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n } from "../lib/n8n.js";
import { safeUrl } from "../lib/messages.js";
import { userDetails } from "../lib/user.js";

const router = Router();
router.use(requireAuth);

const cut = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function fail(res, err) {
  // n8n asked: send the user to this link
  if (err.redirect) return res.json({ redirect: err.redirect });
  console.error("past questions error:", err.message);
  if (err.status === 404) return res.status(404).json({ error: "Not found" });
  if (err.name === "TimeoutError") return res.status(504).json({ error: "Timed out" });
  return res.status(502).json({ error: "Something went wrong" });
}

// the link n8n answers with: { link } (or [{ link }]), only normal web addresses
function linkFrom(data) {
  const first = Array.isArray(data) ? data[0] : data;
  const raw = typeof first === "string" ? first : first?.link;
  if (typeof raw !== "string" || raw.length > 2000) return null;
  return safeUrl(raw.trim());
}

// one set: { code, title, description }. The code is needed to start it but is never shown.
function cleanItem(item) {
  const code = cut(item?.code, 200);
  const title = cut(item?.title, 200);
  if (!code || !title) return null;
  return { code, title, description: cut(item?.description, 300) };
}

// n8n answers [{ "0'25": [ {…}, {…} ], "0'26": [ … ] }]  ->  [{ name, items }]
function groupsFrom(data) {
  const objects = Array.isArray(data) ? data : data && typeof data === "object" ? [data] : [];
  const groups = [];
  for (const obj of objects) {
    if (!obj || typeof obj !== "object") continue;
    for (const [name, list] of Object.entries(obj)) {
      if (!Array.isArray(list)) continue;
      const items = list.map(cleanItem).filter(Boolean).slice(0, 100);
      if (items.length > 0) groups.push({ name: name.slice(0, 60), items });
    }
  }
  return groups.slice(0, 50);
}

// 1. the page loads: the list of subjects
router.get("/subjects", async (req, res) => {
  try {
    const data = await callN8n("pq", userDetails(req));
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

// 2. a subject was tapped: its sets, grouped by class
router.post("/papers", async (req, res) => {
  const subject = cut(req.body?.subject, 100);
  if (!subject) return res.status(400).json({ error: "Missing subject" });
  try {
    const data = await callN8n("pass_pq", { ...userDetails(req), button: subject });
    res.json({ groups: groupsFrom(data) });
  } catch (err) {
    fail(res, err);
  }
});

// 3. a set was chosen (with or without a timer): n8n answers with a link
router.post("/start", async (req, res) => {
  const code = cut(req.body?.code, 200);
  const title = cut(req.body?.title, 200);
  const time = Number(req.body?.time);
  if (!code || !title || !Number.isInteger(time) || time < 0 || time > 150) {
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    const data = await callN8n("qwertpq", { ...userDetails(req), time, code, title });
    const link = linkFrom(data);
    if (!link) return res.status(502).json({ error: "No link" });
    res.json({ link });
  } catch (err) {
    fail(res, err);
  }
});

// 4. "Add past question": n8n answers with a link
router.post("/add", async (req, res) => {
  try {
    const data = await callN8n("add_pq", userDetails(req));
    const link = linkFrom(data);
    if (!link) return res.status(502).json({ error: "No link" });
    res.json({ link });
  } catch (err) {
    fail(res, err);
  }
});

export default router;
export { cut, fail, linkFrom, groupsFrom };