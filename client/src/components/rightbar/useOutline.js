import { useCallback, useEffect, useRef, useState } from "react";
import { getOutline } from "../../lib/api/outline";

const KEEP_MS = 60_000; // a row added from /chat-message survives a refresh that doesn't list it yet

export default function useOutline(chatId) {
  const [links, setLinks] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const latest = useRef(0);
  const extras = useRef(new Map()); // id -> { link, at }

  const refresh = useCallback(() => {
    if (!chatId) return;
    const id = ++latest.current;
    setStatus((s) => (s === "ready" ? s : "loading"));
    getOutline(chatId)
      .then((list) => {
        if (id !== latest.current) return; // a newer request already won
        const now = Date.now();
        const merged = [...list];
        extras.current.forEach(({ link, at }, key) => {
          if (merged.some((l) => l.id === key)) extras.current.delete(key); // n8n lists it now
          else if (now - at < KEEP_MS) merged.push(link); // not listed yet: keep it for a while
          else extras.current.delete(key);
        });
        setLinks(merged);
        setStatus("ready");
      })
      .catch(() => {
        if (id !== latest.current) return;
        setStatus((s) => (s === "ready" ? s : "error"));
      });
  }, [chatId]);

  // a new question: show its row right away
  const add = useCallback((link) => {
    if (!link?.id || !link.title) return;
    extras.current.set(link.id, { link, at: Date.now() });
    setLinks((prev) => (prev.some((l) => l.id === link.id) ? prev : [...prev, link]));
    setStatus("ready");
  }, []);

  // a chat opens (also when /new turns into /chat/:id): start fresh and ask n8n
  useEffect(() => {
    latest.current++;
    extras.current.clear();
    setLinks([]);
    setStatus("idle");
    refresh();
  }, [chatId, refresh]);

  return { links, status, refresh, add };
}