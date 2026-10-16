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
    res = await fetch(`/api/rb${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, "network");
  }
  if (!res.ok) throw new ApiError(res.status, kindFor(res.status));
  return res.json();
}

// [{ id, title, last_updated }]
export const getRoughbooks = () => request("").then((d) => d.books);

// returns the new roughbook's id
export const createRoughbook = (name) =>
  request("", { method: "POST", body: JSON.stringify({ name }) }).then((d) => d.id);

// the chats inside one roughbook: [{ id, title, date }]
export const getRoughbookChats = (rbId) =>
  request(`/${encodeURIComponent(rbId)}/chats`).then((d) => d.chats);