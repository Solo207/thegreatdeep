export const EFFORTS = ["low", "medium", "high"];

// The webhook name n8n's /SMCE switch listens for. Change to "details" if that's what yours uses.
export const DETAIL_QUERY = "detail";

const toBool = (v, fallback) => {
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return fallback;
};

export const effortOf = (v) => {
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

/** What /detail answers with: web search, drive search and effort. The roughbook comes from get-history. */
export function cleanDetail(data) {
  return cleanOptions((Array.isArray(data) ? data[0] : data) || {});
}