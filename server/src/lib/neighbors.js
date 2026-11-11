const ID_RE = /^[\w-]{1,100}$/;
export const neighbor = (v) => (typeof v === "string" && ID_RE.test(v) ? { messageId: v } : null);

export const cleanId = (v) => (typeof v === "string" && ID_RE.test(v) ? v : null);