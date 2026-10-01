import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.resolve(__dirname, "../client/dist");

app.set("trust proxy", 1); // you're behind Easypanel's proxy

// Better Auth BEFORE express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(express.static(distPath));
app.get("{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.resolve(distPath, "index.html"));
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));