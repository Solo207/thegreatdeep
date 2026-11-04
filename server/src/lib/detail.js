import { RB_ID_RE } from "./ids.js";

export const EFFORTS = ["low", "medium", "high"];

const toBool = (v, fallback) => {
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return fallback;
};

const effortOf = (v) => {
  const s = String(v ?? "").toLowerCase();
  return EFFORTS.includes(s) ? s : "medium";
};

/** The three values that travel with every message and every edit. Never both searches off. */
export function cleanOptions(body = {}) {
  const web = toBool(body.webSearch, true);
  const drive = toBool(body.driveSearch, false);
  return {
    webSearch: web || drive ? web : true,
    driveSearch: drive,
    effort: effortOf(body.effort),
  };
}

export const hasOptions = (body) => body && body.effort !== undefined;

/** What /detail answers with: the options plus the chat's project. */
export function cleanDetail(data) {
  const d = (Array.isArray(data) ? data[0] : data) || {};
  const p = d.project ?? d. roughbook;
  const id = typeof p?.id === "string" ? p.id : "";
  const name = String(p?.name ?? p?.title ?? "").slice(0, 60);
  return { ...cleanOptions(d), project: id && RB_ID_RE.test(id) ? { id, name } : null };
}