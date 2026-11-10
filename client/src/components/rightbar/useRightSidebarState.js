import { useCallback, useEffect, useState } from "react";
import useMediaQuery from "../../hooks/useMediaQuery";
import {
  RIGHT_BREAKPOINT,
  RIGHT_DEFAULT_WIDTH,
  RIGHT_MIN_WIDTH,
  RIGHT_MAX_WIDTH,
} from "./config";

const WIDTH_KEY = "rightbar-width";
const OPEN_KEY = "rightbar-open";
const clamp = (n) => Math.min(RIGHT_MAX_WIDTH, Math.max(RIGHT_MIN_WIDTH, n));

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
};

export default function useRightSidebarState() {
  const isDocked = useMediaQuery(`(min-width: ${RIGHT_BREAKPOINT}px)`);
  const [dockedOpen, setDockedOpen] = useState(() => read(OPEN_KEY, "1") === "1");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [peekLocked, setPeekLocked] = useState(false);
  const [width, setWidthState] = useState(() => {
    const n = Number(read(WIDTH_KEY, ""));
    return n ? clamp(n) : RIGHT_DEFAULT_WIDTH;
  });

  const setWidth = (px) => setWidthState(clamp(px));

  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch {
      /* storage unavailable, ignore */
    }
  }, [width]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, dockedOpen ? "1" : "0");
    } catch {
      /* storage unavailable, ignore */
    }
  }, [dockedOpen]);

  // after hiding with a click, keep hover-reveal off until the pointer leaves the icon
  useEffect(() => {
    if (!peekLocked) return;
    const onMove = (e) => {
      const over = e.target instanceof Element && e.target.closest("[data-right-peek-zone]");
      if (!over) setPeekLocked(false);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [peekLocked]);

  const isOpen = isDocked ? dockedOpen : drawerOpen;

  const toggle = () => {
    setPeek(false);
    if (isDocked) {
      setPeekLocked(dockedOpen);
      setDockedOpen((v) => !v);
    } else {
      setDrawerOpen((v) => !v);
    }
  };
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openDrawer = useCallback(() => {
    setPeek(false);
    setDrawerOpen(true);
  }, []);
  const startPeek = () => {
    if (!peekLocked) setPeek(true);
  };
  const endPeek = () => setPeek(false);

  return {
    isDocked, isOpen, toggle, closeDrawer, openDrawer,
    peek, startPeek, endPeek,
    width, setWidth,
  };
}