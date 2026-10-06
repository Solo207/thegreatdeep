// Open event-stream connections, grouped by user id.
// One user can have several (several tabs or devices).
const connections = new Map(); // userId -> Set of open responses

export function addConnection(userId, res) {
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId).add(res);
}

export function removeConnection(userId, res) {
  const set = connections.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) connections.delete(userId);
}

export function countConnections(userId) {
  return connections.get(userId)?.size ?? 0;
}

// Send an event to every open connection of one user.
// Returns how many connections it reached.
export function publish(userId, event, data) {
  const set = connections.get(userId);
  if (!set) return 0;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) res.write(payload);
  return set.size;
}