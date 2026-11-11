/** Ids of the messages around a new message: the last one is above it, nothing is below. */
export function neighborsFor(messages) {
  return { above: messages[messages.length - 1]?.id ?? null, below: null };
}
