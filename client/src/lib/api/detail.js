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
export const addChatToProject = (chatId, p) => addChatToRough(chatId, p.id, p.name); // /addchatrb
export const removeChatFromProject = (chatId, p) => removeChatFromRough(chatId, p.id, p.name); // /rmrb

// /newrb. Only creates it: nothing here navigates anywhere.
export async function createRoughbookId(name) {
  const r = await createRoughbook(name); // ⚠ MATCH to createRoughbook's argument
  const id = r?.id ?? r?.roughbook?.id;
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