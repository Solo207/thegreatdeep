import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/auth.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import chatsRouter from "./src/routes/chats.js"; 
import eventsRouter from "./src/routes/events.js";
import internalRouter from "./src/routes/internal.js";
import pqRouter from "./src/routes/pq.js";
import bmRouter from "./src/routes/bm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.resolve(__dirname, "../client/dist");

app.set("trust proxy", 1); // you're behind Easypanel's proxy

app.use(helmet());

// auth endpoints: generous, because the app asks "am I signed in?" on every page load
app.use("/api/auth", rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: true, legacyHeaders: false }));

// Better Auth BEFORE express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "50kb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/internal", internalRouter);
app.use(
  "/api/events",
  rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }),
  eventsRouter
);

// chats (every route inside requires a signed-in user)   <-- added
app.use(
  "/api/chats",
  rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }),
  chatsRouter
);

app.use(
  "/api/pq",
  rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }),
  pqRouter
);

app.use(
  "/api/bm",
  rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }),
  bmRouter
);

app.use(express.static(distPath));
app.get("{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.resolve(distPath, "index.html"));
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));