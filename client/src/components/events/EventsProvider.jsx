import { useCallback, useEffect, useMemo, useRef } from "react";
import { EventsContext } from "./events-context";

// Opens ONE connection to the server for the whole signed-in app and
// hands every event to whoever is listening (the chat page, the sidebar...).
export default function EventsProvider({ children }) {
  const listeners = useRef(new Set());

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/events"); // reconnects by itself if it drops

    const forward = (type) => (e) => {
      let data;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }
      listeners.current.forEach((fn) => fn({ type, ...data }));
    };
    es.addEventListener("reply", forward("reply"));
    es.addEventListener("reply_failed", forward("reply_failed"));
    es.addEventListener("notice", forward("notice"));

    return () => es.close();
  }, []);

  const value = useMemo(() => ({ subscribe }), [subscribe]);
  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}