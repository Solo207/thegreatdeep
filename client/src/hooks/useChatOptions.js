import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  addChatToProject,
  createRoughbookId,
  getChatDetail,
  removeChatFromProject,
  saveChatDetail,
} from "../lib/api/detail";
import {
  getOptions,
  isLoaded,
  markLoaded,
  putOptions,
  setDraftDefaults,
  subscribe,
  withSearch,
} from "../lib/chatOptions";
import { useToast } from "../components/toast/toast-context";
import { useHistory } from "../components/sidebar/history-context";
import { useRoughbooks } from "../components/roughbooks/roughbooks-context";

// one shared empty list, so "no books yet" doesn't look like a change on every render
const NO_BOOKS = [];

export default function useChatOptions(chatId) {
  const toast = useToast();
  const { chats = [], pinned = [], refresh } = useHistory();
  const { books = NO_BOOKS, refresh: refreshBooks, ensureLoaded } = useRoughbooks();
  const stored = useSyncExternalStore(subscribe, () => getOptions(chatId));
  const [loading, setLoading] = useState(() => !isLoaded(chatId));
  const [override, setOverride] = useState(undefined); // shown while a roughbook change is running

  // make sure the roughbook list is there, so a chat's roughbook can be matched by name
  useEffect(() => {
    if (chatId) ensureLoaded?.();
  }, [chatId, ensureLoaded]);

  // the chat's roughbook, straight from the history lists; copes with a missing
  // id by matching the roughbook's name
  const fromHistory = useMemo(() => {
    if (!chatId) return null;
    const c = [...pinned, ...chats].find((x) => x.id === chatId);
    if (!c) return null;
    const rid = c.rough_id ?? c.roughId; // the server sends roughId
    const name =
      (typeof c.rough === "string" && c.rough) ||
      books.find((b) => b.id === rid)?.title ||
      "";
    const id = rid || books.find((b) => b.title === name)?.id || null;
    return id || name ? { id, name } : null;
  }, [chatId, chats, pinned, books]);

  const project = chatId
    ? override !== undefined
      ? override
      : (fromHistory ?? stored.project ?? null)
    : (stored.project ?? null);

  const options = useMemo(() => ({ ...stored, project }), [stored, project]);

  // read the saved search + effort values from n8n once per chat
  useEffect(() => {
    if (isLoaded(chatId)) {
      setLoading(false);
      return;
    }
    let ignore = false;
    setLoading(true);
    getChatDetail(chatId)
      .then((detail) => {
        if (ignore) return;
        markLoaded(chatId);
        const { webSearch, driveSearch, effort } = detail;
        if (chatId) putOptions(chatId, { ...getOptions(chatId), webSearch, driveSearch, effort });
        else setDraftDefaults({ webSearch, driveSearch, effort });
      })
      .catch(() => {})
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [chatId]);

  const save = useCallback(
    (patch) => {
      const prev = getOptions(chatId);
      const next = withSearch(prev, patch);
      putOptions(chatId, next);
      if (!chatId) return; // new chat: travels with the first message
      saveChatDetail(chatId, next).catch(() => {
        putOptions(chatId, prev);
        toast("Couldn't save that setting");
      });
    },
    [chatId, toast],
  );

  /**
   * next = { id, name }          an existing roughbook
   *      = { name, isNew: true } a roughbook to create
   *      = null                  take the chat out of its roughbook
   */
  const setProject = useCallback(
    async (next) => {
      // /new chat: only remember it; nothing is called until after /chat-message
      if (!chatId) {
        putOptions(null, { ...getOptions(null), project: next });
        return;
      }

      const current = project;
      setOverride(next);
      let target = next;
      let step = "";
      try {
        if (!next) {
          step = "remove"; // /rmrb
          if (current) await removeChatFromProject(chatId, current);
        } else {
          if (next.isNew) {
            step = "create"; // /newrb, no redirect
            const id = await createRoughbookId(next.name);
            target = { id, name: next.name };
            refreshBooks?.();
          }
          step = "add"; // /addchatrb
          await addChatToProject(chatId, target);
        }
        putOptions(chatId, { ...getOptions(chatId), project: target });
        await Promise.resolve(refresh()).catch(() => {});
      } catch (err) {
        console.error("Roughbook change failed at", step, err);
        toast(`Couldn't change the roughbook (${step}${err?.status ? " " + err.status : ""})`);
      } finally {
        setOverride(undefined);
      }
    },
    [chatId, project, refresh, refreshBooks, toast],
  );

  return {
    options,
    loading,
    isDraft: !chatId,
    setWebSearch: (on) => save({ webSearch: on }),
    setDriveSearch: (on) => save({ driveSearch: on }),
    setEffort: (effort) => save({ effort }),
    setProject,
  };
}