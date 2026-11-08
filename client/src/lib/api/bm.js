import { makeCachedLoader, prefetchAll } from "../papersCache";
import { ApiError } from "./chats";
import { unwrap } from "./http";

const kindFor = (status) =>
  status === 401 ? "signed_out"
  : status === 404 ? "not_found"
  : status === 429 ? "rate_limited"
  : status === 504 ? "timeout"
  : "failed";

const bookmarks = makeCachedLoader((subject) =>
  request("/papers", { method: "POST", body: JSON.stringify({ subject }) }).then((d) => d.groups)
);

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
  return unwrap(res);
}

// ["Microbiology", ...]
export const getBookmarkSubjects = () => request("/subjects").then((d) => d.subjects);

export const getBookmarks = bookmarks.get;
export const prefetchBookmarks = (subjects, first, shouldStop) =>
  prefetchAll(bookmarks, subjects, first, shouldStop);

// remove one bookmark (only code and title are sent); the saved lists are now out of date
export const deleteBookmark = ({ code, title }) =>
  request("/delete", { method: "POST", body: JSON.stringify({ code, title }) }).then((r) => {
    bookmarks.clear();
    return r;
  });
// time = minutes, 0 = no timer. Returns the link.
export const startBookmark = ({ code, title, time }) =>
  request("/start", { method: "POST", body: JSON.stringify({ code, title, time }) }).then(
    (d) => d.link
  );