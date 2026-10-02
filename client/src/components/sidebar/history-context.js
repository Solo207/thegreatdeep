import { createContext, useContext } from "react";

export const HistoryContext = createContext(null);

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used inside <HistoryProvider>");
  return ctx;
}