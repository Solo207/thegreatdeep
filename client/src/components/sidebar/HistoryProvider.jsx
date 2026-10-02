import { useCallback, useEffect, useRef, useState } from "react";
import { getHistory } from "../../lib/api/chats";
import { HistoryContext } from "./history-context";

export default function HistoryProvider({ children }) {
  const [chats, setChats] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const latest = useRef(0);

  // Reload the list in the background. The old list stays on screen meanwhile.
  const refresh = useCallback(async () => {
    const id = ++latest.current;
    try {
      const data = await getHistory(false);
      if (id !== latest.current) return; // a newer request already won
      setChats(data.chats);
      setHasMore(data.hasMore);
      setStatus("ready");
    } catch {
      if (id !== latest.current) return;
      setStatus((s) => (s === "ready" ? s : "error")); // keep an old list if we have one
    }
  }, []);

  const retry = useCallback(() => {
    setStatus("loading");
    refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <HistoryContext.Provider value={{ chats, hasMore, status, refresh, retry }}>
      {children}
    </HistoryContext.Provider>
  );
}