export const DEFAULT_OPTIONS = { webSearch: true, driveSearch: false, effort: "medium", project: null };

const DRAFT = "draft"; // the chat that doesn't exist yet
const store = new Map(); // key -> options
const loaded = new Set(); // keys already read from /detail
const pendingProject = new Map(); // chatId -> project waiting for the first message
const listeners = new Set();
let draftDefaults = DEFAULT_OPTIONS;

const adoptedAt = new Map(); // chatId -> when its values came from the draft

const emit = () => listeners.forEach((fn) => fn());
const keyOf = (chatId) => chatId || DRAFT;

export const justAdopted = (chatId) =>
  Boolean(chatId) && Date.now() - (adoptedAt.get(chatId) ?? 0) < 60_000;

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getOptions = (chatId) =>
  store.get(keyOf(chatId)) ?? (chatId ? DEFAULT_OPTIONS : draftDefaults);

export const putOptions = (chatId, options) => {
  store.set(keyOf(chatId), options);
  emit();
};

export const isLoaded = (chatId) => loaded.has(keyOf(chatId));
export const markLoaded = (chatId) => loaded.add(keyOf(chatId));

export function setDraftDefaults(detail) {
  draftDefaults = { ...DEFAULT_OPTIONS, ...detail, project: null };
  if (!store.has(DRAFT)) emit(); // keep whatever the user already picked
}

/** Merge a change in; if both searches end up off, switch the other one on. */
export function withSearch(options, patch) {
  const next = { ...options, ...patch };
  if (!next.webSearch && !next.driveSearch) {
    if ("driveSearch" in patch) next.webSearch = true;
    else next.driveSearch = true;
  }
  return next;
}

export function searchInfo({ webSearch, driveSearch }) {
  if (webSearch && driveSearch) return "Results will be diluted by web results";
  if (driveSearch) return "Answers will be from your drive";
  return "Answers will be from the web";
}

/** Sent with every /chat-message. Empty until the chat's values have been read, so nothing is overwritten. */
export function optionsPayload(chatId) {
  if (chatId && !loaded.has(chatId)) return {};
  const { webSearch, driveSearch, effort } = getOptions(chatId);
  return { webSearch, driveSearch, effort };
}

/** Call when a new chat is created: the draft becomes that chat's options. */
export function adoptDraft(chatId, { skipProject = false } = {}) {
  const draft = getOptions(null);
  const project = skipProject ? null : draft.project;
  store.set(chatId, { ...draft, project });
  loaded.add(chatId);
  if (project) pendingProject.set(chatId, project);
  store.delete(DRAFT); // next new chat starts from the defaults again
  emit();
}

export function takePendingProject(chatId) {
  const p = pendingProject.get(chatId) ?? null;
  pendingProject.delete(chatId);
  return p;
}