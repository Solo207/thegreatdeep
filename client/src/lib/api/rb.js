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
    res = await fetch(`/api/rb${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, "network");
  }
  if (!res.ok) throw new ApiError(res.status, kindFor(res.status));
  return unwrap(res);
}

// [{ id, title, last_updated }]
export const getRoughbooks = () => request("").then((d) => d.books);

// returns the new roughbook's id
export const createRoughbook = (name) =>
  request("", { method: "POST", body: JSON.stringify({ name }) }).then((d) => d.id);

// the chats inside one roughbook: [{ id, title, date }]
export const getRoughbookChats = (rbId) =>
  request(`/${encodeURIComponent(rbId)}/chats`).then((d) => d.chats);

// rename a roughbook
export const renameRoughbook = (rbId, name) =>
  request(`/${encodeURIComponent(rbId)}/rename`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

// delete a roughbook; includeChats says whether its chats go too
export const deleteRoughbook = (rbId, includeChats) =>
  request(`/${encodeURIComponent(rbId)}/delete`, {
    method: "POST",
    body: JSON.stringify({ includeChats }),
  });