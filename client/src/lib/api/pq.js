import { ApiError } from "./chats";
import { unwrap } from "./http";

const kindFor = (status) =>
  status === 401 ? "signed_out"
  : status === 404 ? "not_found"
  : status === 429 ? "rate_limited"
  : status === 504 ? "timeout"
  : "failed";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api/pq${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, "network");
  }
  if (!res.ok) throw new ApiError(res.status, kindFor(res.status));
  return unwrap(res);
}

// ["Chemical Pathology", "Hematology", ...]
export const getSubjects = () => request("/subjects").then((d) => d.subjects);

// [{ name: "0'25", items: [{ code, title, description }] }, ...]
export const getPapers = (subject) =>
  request("/papers", { method: "POST", body: JSON.stringify({ subject }) }).then((d) => d.groups);

// time = minutes, 0 = no timer. Returns the link.
export const startPaper = ({ code, title, time }) =>
  request("/start", { method: "POST", body: JSON.stringify({ code, title, time }) }).then(
    (d) => d.link
  );

// Returns the link.
export const addPastQuestion = () => request("/add", { method: "POST" }).then((d) => d.link);