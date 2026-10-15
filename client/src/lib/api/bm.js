import { ApiError } from "./chats";

const kindFor = (status) =>
  status === 401 ? "signed_out"
  : status === 404 ? "not_found"
  : status === 429 ? "rate_limited"
  : status === 504 ? "timeout"
  : "failed";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api/bm${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, "network");
  }
  if (!res.ok) throw new ApiError(res.status, kindFor(res.status));
  return res.json();
}

// ["Microbiology", ...]
export const getBookmarkSubjects = () => request("/subjects").then((d) => d.subjects);

// [{ name: "0'25", items: [{ code, title, description }] }, ...]
export const getBookmarks = (subject) =>
  request("/papers", { method: "POST", body: JSON.stringify({ subject }) }).then((d) => d.groups);

// remove one bookmark (only code and title are sent)
export const deleteBookmark = ({ code, title }) =>
  request("/delete", { method: "POST", body: JSON.stringify({ code, title }) });

// time = minutes, 0 = no timer. Returns the link.
export const startBookmark = ({ code, title, time }) =>
  request("/start", { method: "POST", body: JSON.stringify({ code, title, time }) }).then(
    (d) => d.link
  );