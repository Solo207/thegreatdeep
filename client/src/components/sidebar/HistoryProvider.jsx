import { useCallback, useEffect, useRef, useState } from "react";
import { getHistory } from "../../lib/api/chats";
import { getPinned } from "../../lib/api/chatActions";
import { useEvents } from "../events/events-context";
import { HistoryContext } from "./history-context";

export default function HistoryProvider({ children }) {
  const [chats, setChats] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const latest = useRef(0);

  // Reload the lists in the background. The old lists stay on screen meanwhile.
  const refresh = useCallback(async () => {
    const id = ++latest.current;
    try {
      // the pinned list is optional: if it fails, the old one stays
      const [data, pins] = await Promise.all([getHistory(), getPinned().catch(() => null)]);
      if (id !== latest.current) return; // a newer request already won
      setChats(data.chats);
      setHasMore(data.hasMore);
      if (pins) setPinned(pins);
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

  const { subscribe } = useEvents();

  // when a reply arrives, the lists (titles, order) may have changed
  useEffect(
    () =>
      subscribe((evt) => {
        if (evt.type === "reply") refresh();
      }),
    [subscribe, refresh]
  );

  useEffect(() => {
  const onRefresh = () => Promise.resolve(refresh()).catch(() => {});
  window.addEventListener("sidebar:refresh", onRefresh);
  return () => window.removeEventListener("sidebar:refresh", onRefresh);
}, [refresh]);

  return (
    <HistoryContext.Provider value={{ chats, pinned, hasMore, status, refresh, retry }}>
      {children}
    </HistoryContext.Provider>
  );
}