import { Router } from "express";
import rateLimit from "express-rate-limit";
import requireAuth from "../middleware/requireAuth.js";
import { callN8n, actionN8n } from "../lib/n8n.js";
import { userDetails } from "../lib/user.js";
import { cut, fail } from "./pq.js";

const router = Router();

// Strict limit only for the destructive call
router.post(
  "/resign",
  rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false }),
  requireAuth,
  async (req, res) => {
    try {
      await actionN8n("resign", userDetails(req));
      res.json({ ok: true });
    } catch (err) {
      fail(res, err);
    }
  },
);

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const data = await callN8n("profile", userDetails(req));
    const p = (Array.isArray(data) ? data[0] : data) || {};
    const pick = (...keys) => {
      for (const k of keys) {
        if (typeof p[k] === "string" || typeof p[k] === "number") return cut(String(p[k]), 200);
      }
      return "";
    };
    const image =
      typeof req.user?.image === "string" && /^https:\/\//i.test(req.user.image) ? req.user.image : "";

    res.json({
      profile: {
        image, // straight from the Better Auth user table (user.image)
        email: pick("email") || req.user?.email || "",
        userName: pick("userName", "username", "name") || req.user?.name || "",
        phone: pick("phone", "phoneNumber", "phone_number"),
        department: pick("department"),
        school: pick("school"),
        level: pick("level"),
      },
    });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/greeting", requireAuth, async (req, res) => {
  try {
    const data = await callN8n("greet", userDetails(req));
    const first = Array.isArray(data) ? data[0] : data;
    const raw = typeof first === "string" ? first : (first?.greeting ?? first?.text);
    const greeting =
      typeof raw === "string" ? raw.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 200) : "";
    res.json({ greeting });
  } catch (err) {
    fail(res, err);
  }
});

export default router;