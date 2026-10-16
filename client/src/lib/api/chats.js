// The only file that calls /api/chats. Pages and hooks use these functions.

export class ApiError extends Error {
  constructor(status, kind) {
    super(kind);
    this.status = status; // HTTP status, or 0 if the request never reached the server
    this.kind = kind;     // a simple label the UI can react to
  }
}

function kindFor(status) {
  if (status === 401) return "signed_out";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status === 504) return "timeout";
  return "failed";
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api/chats${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, "network"); // offline, server down, etc.
  }
  if (!res.ok) throw new ApiError(res.status, kindFor(res.status));
  return res.json();
}

// Create an empty chat (inside a roughbook when rb is given). Returns its id.
export async function createChat({ rb } = {}) {
  const data = await request("", {
    method: "POST",
    body: JSON.stringify(rb ? { rb } : {}),
  });
  return data.id;
}

// Load a chat. Returns { chat: { id, title }, messages: [...] }
export function getChat(chatId) {
  return request(`/${chatId}`);
}

// Send a message. `selection` is set when the user tapped a button or list row:
// { id, source: "buttons" | "list", messageId }
export function sendMessage(chatId, content, selection = null) {
  return request(`/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, selection }),
  });
}

// Load the chat list. Returns { chats: [{ id, title, date }], hasMore }
export function getHistory(all = false) {
  return request(all ? "?all=true" : "");
}

// Download a document. n8n's workflow produces the file, and the server passes it on.
// Returns { blob, filename } (the server decides the file name).
export async function downloadDoc(chatId, messageId, { link, name, filetype }) {
  const params = new URLSearchParams();
  if (link) params.set("link", link);
  if (name) params.set("name", name);
  if (filetype) params.set("filetype", filetype);

  let res;
  try {
    res = await fetch(`/api/chats/${chatId}/docs/${messageId}?${params}`);
  } catch {
    throw new ApiError(0, "network"); // offline, server down, etc.
  }
  if (!res.ok) throw new ApiError(res.status, kindFor(res.status));

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  return { blob: await res.blob(), filename: match ? match[1] : "document" };
}