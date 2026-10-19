import { useEffect, useState } from "react";

// A section that can be folded away; the choice is remembered after a reload.
export default function useCollapsed(key) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, collapsed ? "1" : "0");
    } catch {
      /* storage unavailable, ignore */
    }
  }, [key, collapsed]);

  return [collapsed, () => setCollapsed((v) => !v)];
}