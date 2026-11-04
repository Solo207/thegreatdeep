import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  addChatToProject,
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

export default function useChatOptions(chatId) {
  const toast = useToast();
  const { refresh } = useHistory();
  const options = useSyncExternalStore(subscribe, () => getOptions(chatId));
  const [loading, setLoading] = useState(() => !isLoaded(chatId));

  // Read the saved values from /detail once per chat
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
        if (chatId) putOptions(chatId, detail);
        else setDraftDefaults(detail);
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

  const setProject = useCallback(
    async (project) => {
      const prev = getOptions(chatId);
      putOptions(chatId, { ...prev, project });
      if (!chatId) return; // empty chat: wait for the first question
      try {
        if (prev.project && prev.project.id !== project?.id) {
          await removeChatFromProject(chatId, prev.project);
        }
        if (project) await addChatToProject(chatId, project);
        refresh().catch(() => {});
      } catch {
        putOptions(chatId, prev);
        toast("Couldn't change the project");
      }
    },
    [chatId, refresh, toast],
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