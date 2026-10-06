// Which chats are waiting for n8n to finish.
// Kept in memory, which is fine for one Express instance (your single container).
const pending = new Map(); // "userId:chatId" -> { words }

const key = (userId, chatId) => `${userId}:${chatId}`;

export function markPending(userId, chatId, words = []) {
  pending.set(key(userId, chatId), { words });
}

export function setPendingWords(userId, chatId, words) {
  const entry = pending.get(key(userId, chatId));
  if (entry) entry.words = words;
}

export function clearPending(userId, chatId) {
  pending.delete(key(userId, chatId));
}

export function getPending(userId, chatId) {
  return pending.get(key(userId, chatId)) ?? null;
}