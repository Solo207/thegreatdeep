import { Router } from "express";
import crypto from "crypto";
import { publish } from "../lib/events.js";
import { clearPending } from "../lib/pending.js";
import { normalizeMessage } from "../lib/messages.js";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// n8n calls this for every message it wants shown, and once more with
// "done": true when it has finished. It never touches the database,
// it only pushes to the screens that user has open.
router.post("/messages", (req, res) => {
  if (!secretOk(req)) {
    console.log("[callback] rejected: wrong or missing X-Callback-Secret");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId, chatId, message, error, done } = req.body ?? {};
  if (
    typeof userId !== "string" ||
    userId.length === 0 ||
    userId.length > 200 ||
    !UUID_RE.test(chatId)
  ) {
    console.log("[callback] rejected: bad userId or chatId");
    return res.status(400).json({ error: "Bad request" });
  }

  // n8n reports a failure
  if (error) {
    clearPending(userId, chatId);
    const delivered = publish(userId, "reply_failed", { chatId });
    console.log(`[callback] chat=${chatId} error=true delivered=${delivered}`);
    return res.json({ ok: true, delivered });
  }

  // accept true and "true" (n8n sometimes turns booleans into text)
  const isDone = done === true || done === "true";

  // callbacks from n8n are always assistant messages, so don't trust the role field
  const normalized = message ? normalizeMessage({ ...message, role: "assistant" }) : null;

  // "done" always unlocks the page, even if its message is unusable
  if (isDone) clearPending(userId, chatId);

  if (!normalized) {
    if (isDone) {
      const delivered = publish(userId, "reply", { chatId, message: null, done: true });
      console.log(
        `[callback] chat=${chatId} message=${message ? "UNUSABLE" : "none"} done=true delivered=${delivered}`
      );
      return message
        ? res.status(400).json({ error: "Bad message (page was unlocked anyway)", delivered })
        : res.json({ ok: true, delivered });
    }
    console.log(`[callback] chat=${chatId} message=UNUSABLE done=false`);
    return res.status(400).json({ error: "Bad message" });
  }

  const delivered = publish(userId, "reply", {
    chatId,
    message: normalized,
    done: isDone,
  });
  console.log(
    `[callback] chat=${chatId} type=${normalized.type} done=${isDone} delivered=${delivered}`
  );
  res.json({ ok: true, delivered });
});

export default router;