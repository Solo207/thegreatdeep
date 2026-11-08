import { ApiError } from "./chats";
import { unwrap } from "./http";
import { makeCachedLoader, prefetchAll } from "../papersCache";


const kindFor = (status) =>
  status === 401 ? "signed_out"
  : status === 404 ? "not_found"
  : status === 429 ? "rate_limited"
  : status === 504 ? "timeout"
  : "failed";

const papers = makeCachedLoader((subject) =>
  request("/papers", { method: "POST", body: JSON.stringify({ subject }) }).then((d) => d.groups)
);

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
export const getPapers = papers.get;
export const prefetchPapers = (subjects, first, shouldStop) =>
  prefetchAll(papers, subjects, first, shouldStop);

// time = minutes, 0 = no timer. Returns the link.
export const startPaper = ({ code, title, time }) =>
  request("/start", { method: "POST", body: JSON.stringify({ code, title, time }) }).then(
    (d) => d.link
  );

  
// Returns the link.
export const addPastQuestion = () => request("/add", { method: "POST" }).then((d) => d.link);