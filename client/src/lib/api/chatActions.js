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
    res = await fetch(`/api/chats${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, "network");
  }
  if (!res.ok) throw new ApiError(res.status, kindFor(res.status));
  return unwrap(res);
}

const post = (path, body) =>
  request(path, { method: "POST", body: JSON.stringify(body ?? {}) });

// [{ id, title, date, rough }]
export const getPinned = () => request("/pinned").then((d) => d.chats);
export const getAllChats = () => request("/all").then((d) => d.chats);

export const pinChat = (chatId, pin) => post(`/${chatId}/pin`, { pin });
export const renameChat = (chatId, name) => post(`/${chatId}/rename`, { name });

// chatIds is always an array, even for one chat
export const deleteChats = (chatIds) => post("/delete", { chatIds });

// book = { id, title } of the roughbook
export const addChatToRough = (chatId, book) =>
  post(`/${chatId}/rough`, { roughId: book.id, roughName: book.title });
// book = { id, name } of the roughbook the chat is in (matched by id)
export const removeChatFromRough = (chatId, { id, name }) =>
  post(`/${chatId}/rough/remove`, { roughId: id, roughName: name }); 