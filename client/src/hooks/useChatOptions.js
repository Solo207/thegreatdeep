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

export default function useChatOptions(chatId) {
  const toast = useToast();
  const { chats = [], pinned = [], refresh } = useHistory();
  const roughbooks = useRoughbooks();
  const stored = useSyncExternalStore(subscribe, () => getOptions(chatId));
  const [loading, setLoading] = useState(() => !isLoaded(chatId));
  const [override, setOverride] = useState(undefined); // shown while a roughbook change is running

  // the chat's roughbook, straight from the history lists
  const fromHistory = useMemo(() => {
    if (!chatId) return null;
    const c = [...pinned, ...chats].find((x) => x.id === chatId);
    return c?.rough_id
      ? { id: c.rough_id, name: typeof c.rough === "string" ? c.rough : "" }
      : null;
  }, [chatId, chats, pinned]);

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
      try {
        if (!next) {
          if (current) await removeChatFromProject(chatId, current); // /rmrb
        } else {
          if (next.isNew) {
            const id = await createRoughbookId(next.name); // /newrb, no redirect
            target = { id, name: next.name };
            roughbooks.refresh?.();
          }
          await addChatToProject(chatId, target); // /addchatrb
        }
        putOptions(chatId, { ...getOptions(chatId), project: target });
        await Promise.resolve(refresh()).catch(() => {});
      } catch {
        toast("Couldn't change the roughbook");
      } finally {
        setOverride(undefined);
      }
    },
    [chatId, project, refresh, roughbooks, toast],
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