import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

export default async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) return res.status(401).json({ error: "Not signed in" });
  req.user = session.user; // routes use req.user.id, never an id from the browser
  next();
}