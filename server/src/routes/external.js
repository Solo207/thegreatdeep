import { Router } from "express";
import { publish } from "../lib/events.js";
import { secretOk } from "../lib/secret.js";

const router = Router();
const MAX_TEXT = 600;

// The backend decides to tell a user something. It is pushed to every screen that user has
// open (all their tabs and devices), and nothing is stored: a user who is offline simply
// doesn't get it ("delivered": 0).
//
//   POST /api/external        header: X-Callback-Secret
//   { "role": "notice", "userId": "…",
//     "content": [ { "type": "text", "text": "Can you summarize this page? <<https://…>>" } ] }
router.post("/", (req, res) => {
  if (!secretOk(req)) return res.status(401).json({ error: "Unauthorized" });

  const { role, userId, content } = req.body ?? {};

  // punctuation in "role" is ignored, as with the other messages from n8n
  const kind = String(role ?? "").replace(/[^a-z]/gi, "").toLowerCase();
  if (kind !== "notice") return res.status(400).json({ error: "Unknown role" });

  if (typeof userId !== "string" || userId.length === 0 || userId.length > 200) {
    return res.status(400).json({ error: "Bad userId" });
  }

  // all the text items, joined; links stay written as <<https://…>> for the page to read
  const text = (Array.isArray(content) ? content : [])
    .filter((p) => p?.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, MAX_TEXT);
  if (!text) return res.status(400).json({ error: "No text" });

  const delivered = publish(userId, "notice", { text });
  console.log(`[external] notice delivered to ${delivered} open screen(s)`);
  res.json({ ok: true, delivered });
});

export default router;