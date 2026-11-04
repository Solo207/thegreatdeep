import { unwrap } from "./http";
import { addChatToRough, removeChatFromRough } from "./chatActions";
import { createRoughbook } from "./rb";

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

// ⚠ MATCH THESE TWO LINES to how ChatActions.jsx calls addChatToRough / removeChatFromRough
export const addChatToProject = (chatId, p) =>
  addChatToRough(chatId, { id: p.id, title: p.name }); // /addchatrb

export const removeChatFromProject = (chatId, p) =>
  removeChatFromRough(chatId, { id: p.id, name: p.name }); // /rmrb

// /newrb. Only creates it: nothing here navigates anywhere.
export async function createRoughbookId(name) {
  const r = await createRoughbook(name); // ⚠ match to createRoughbook's argument
  console.log("createRoughbook answered:", r); // temporary: shows the real shape
  const id =
    typeof r === "string" || typeof r === "number"
      ? String(r)
      : (r?.id ?? r?.roughbook?.id ?? r?.book?.id ?? r?.data?.id ?? r?.rbId);
  if (!id) throw new Error("No roughbook id");
  return id;
}

/** A /new chat's roughbook, applied only after /chat-message was accepted. */
export async function applyPendingProject(chatId, project) {
  try {
    const id = project.isNew ? await createRoughbookId(project.name) : project.id;
    await addChatToProject(chatId, { id, name: project.name });
    window.dispatchEvent(new Event("sidebar:refresh"));
  } catch {
    // the chat is fine; the roughbook can be set again from the + menu
  }
}