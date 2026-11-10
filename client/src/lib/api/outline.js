import { ApiError } from "./chats";
import { unwrap } from "./http";

// [{ id, title }, ...]: one per question the user asked in this chat (n8n query /rightsb)
export async function getOutline(chatId) {
  let res;
  try {
    res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/outline`, { credentials: "include" });
  } catch {
    throw new ApiError(0, "network");
  }
  if (!res.ok) throw new ApiError(res.status, "failed");
  const data = await unwrap(res);
  return data.links ?? [];
}