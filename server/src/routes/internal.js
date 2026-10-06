import { Router } from "express";
import crypto from "crypto";
import { publish } from "../lib/events.js";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REPLY_CHARS = 30_000;

// Compare the secret without leaking timing information
function secretOk(req) {
  const given = Buffer.from(String(req.get("x-callback-secret") ?? ""));
  const expected = Buffer.from(process.env.N8N_CALLBACK_SECRET ?? "");
  return (
    expected.length > 0 &&
    given.length === expected.length &&
    crypto.timingSafeEqual(given, expected)
  );
}

// n8n calls this when it has finished (or failed). It never touches the database,
// it only pushes the result to the screens that user has open.
router.post("/messages", (req, res) => {
  if (!secretOk(req)) return res.status(401).json({ error: "Unauthorized" });

  const { userId, chatId, message, error } = req.body ?? {};
  if (
    typeof userId !== "string" ||
    userId.length === 0 ||
    userId.length > 200 ||
    !UUID_RE.test(chatId)
  ) {
    return res.status(400).json({ error: "Bad request" });
  }

  // n8n reports a failure
  if (error) {
    const delivered = publish(userId, "reply_failed", { chatId });
    return res.json({ ok: true, delivered });
  }

  // n8n delivers a reply
  if (
    !message ||
    message.role !== "assistant" ||
    typeof message.content !== "string" ||
    message.content.length === 0 ||
    message.content.length > MAX_REPLY_CHARS
  ) {
    return res.status(400).json({ error: "Bad message" });
  }

  // the id is only a label for the page, so be forgiving: use it if it looks sane,
  // otherwise make one up
  const id =
    typeof message.id === "string" && message.id.length > 0 && message.id.length <= 100
      ? message.id
      : crypto.randomUUID();

  const delivered = publish(userId, "reply", {
    chatId,
    message: {
      id,
      role: "assistant",
      content: message.content,
      createdAt: String(message.createdAt ?? ""),
    },
  });
  res.json({ ok: true, delivered });
});

export default router;