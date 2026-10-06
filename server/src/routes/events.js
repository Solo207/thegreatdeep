import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  addConnection,
  removeConnection,
  countConnections,
} from "../lib/events.js";

const router = Router();
const MAX_CONNECTIONS_PER_USER = 8;

// The page opens this once and keeps it open.
router.get("/", requireAuth, (req, res) => {
  const userId = req.user.id;
  if (countConnections(userId) >= MAX_CONNECTIONS_PER_USER) {
    return res.status(429).end();
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform", // no-transform: nobody may buffer or compress it
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // tells proxies not to hold messages back
  });
  res.flushHeaders();
  res.write("retry: 3000\n\n"); // if the connection drops, the browser reconnects after 3 s

  addConnection(userId, res);

  // the "still here" ping every 25 seconds (ignored by the page)
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeConnection(userId, res);
  });
});

export default router;
