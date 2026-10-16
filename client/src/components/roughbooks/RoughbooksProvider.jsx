import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRoughbooks } from "../../lib/api/rb";
import { RoughbooksContext } from "./roughbooks-context";

export default function RoughbooksProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const latest = useRef(0);
  const statusRef = useRef("idle");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // always asks n8n (the old list stays on screen meanwhile)
  const refresh = useCallback(async () => {
    const id = ++latest.current;
    setStatus((s) => (s === "ready" ? s : "loading"));
    try {
      const list = await getRoughbooks();
      if (id !== latest.current) return;
      setBooks(list);
      setStatus("ready");
    } catch {
      if (id !== latest.current) return;
      setStatus((s) => (s === "ready" ? s : "error"));
    }
  }, []);

  // asks only if the list was never loaded (or failed last time)
  const ensureLoaded = useCallback(() => {
    if (statusRef.current === "idle" || statusRef.current === "error") refresh();
  }, [refresh]);

  // a roughbook that was just created shows up at once
  const add = useCallback((book) => {
    setBooks((prev) => [book, ...prev.filter((b) => b.id !== book.id)]);
    setStatus("ready");
  }, []);

  const value = useMemo(
    () => ({ books, status, refresh, ensureLoaded, add }),
    [books, status, refresh, ensureLoaded, add]
  );

  return <RoughbooksContext.Provider value={value}>{children}</RoughbooksContext.Provider>;
}