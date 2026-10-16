import { createContext, useContext } from "react";

export const RoughbooksContext = createContext(null);

export function useRoughbooks() {
  const ctx = useContext(RoughbooksContext);
  if (!ctx) throw new Error("useRoughbooks must be used inside <RoughbooksProvider>");
  return ctx;
}