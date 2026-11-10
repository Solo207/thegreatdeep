import { useCallback, useEffect, useRef, useState } from "react";
import { getOutline } from "../../lib/api/outline";

export default function useOutline(chatId) {
  const [links, setLinks] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const latest = useRef(0);

  const refresh = useCallback(() => {
    if (!chatId) return;
    const id = ++latest.current;
    setStatus((s) => (s === "ready" ? s : "loading"));
    getOutline(chatId)
      .then((list) => {
        if (id !== latest.current) return; // a newer request already won
        setLinks(list);
        setStatus("ready");
      })
      .catch(() => {
        if (id !== latest.current) return;
        setStatus((s) => (s === "ready" ? s : "error"));
      });
  }, [chatId]);

  // a chat opens (also when /new turns into /chat/:id): start fresh and ask n8n
  useEffect(() => {
    latest.current++;
    setLinks([]);
    setStatus("idle");
    refresh();
  }, [chatId, refresh]);

  return { links, status, refresh };
}