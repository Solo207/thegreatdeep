import { unwrap } from "./http";

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function getChatDetail(chatId) {
  const url = chatId ? `/api/chats/${encodeURIComponent(chatId)}/detail` : "/api/chats/detail";
  return unwrap(await fetch(url, { credentials: "include" }));
}

export async function saveChatDetail(chatId, { webSearch, driveSearch, effort }) {
  await unwrap(
    await fetch(`/api/chats/${encodeURIComponent(chatId)}/detail`, {
      method: "POST",
      credentials: "include",
      headers: JSON_HEADERS,
      body: JSON.stringify({ webSearch, driveSearch, effort }),
    }),
  );
}

// project = { id, name }. The body fields assume your existing /rough routes take rbId + rbName.
export async function addChatToProject(chatId, project) {
  await unwrap(
    await fetch(`/api/chats/${encodeURIComponent(chatId)}/rough`, {
      method: "POST",
      credentials: "include",
      headers: JSON_HEADERS,
      body: JSON.stringify({ rbId: project.id, rbName: project.name }),
    }),
  );
}

export async function removeChatFromProject(chatId, project) {
  await unwrap(
    await fetch(`/api/chats/${encodeURIComponent(chatId)}/rough/remove`, {
      method: "POST",
      credentials: "include",
      headers: JSON_HEADERS,
      body: JSON.stringify({ rbId: project.id, rbName: project.name }),
    }),
  );
}