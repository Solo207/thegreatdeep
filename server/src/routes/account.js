import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { actionN8n } from "../lib/n8n.js";
import { userDetails } from "../lib/user.js";
import { fail } from "./pq.js";

const router = Router();

// "Change user details": n8n clears the history and bookmarks (query /resign).
// It may answer with a link to send the user to.
router.post("/resign", requireAuth, async (req, res) => {
  try {
    await actionN8n("resign", userDetails(req));
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

export default router;