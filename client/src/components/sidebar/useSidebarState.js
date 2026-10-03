import { useEffect, useState } from "react";
import useMediaQuery from "../../hooks/useMediaQuery";
import {
  SIDEBAR_BREAKPOINT,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
} from "./config";

const WIDTH_KEY = "sidebar-width";
const clamp = (n) => Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, n));

function loadWidth() {
  try {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    return saved ? clamp(saved) : SIDEBAR_DEFAULT_WIDTH;
  } catch {
    return SIDEBAR_DEFAULT_WIDTH;
  }
}

export default function useSidebarState() {
  const isDesktop = useMediaQuery(`(min-width: ${SIDEBAR_BREAKPOINT}px)`);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [peekLocked, setPeekLocked] = useState(false);
  const [width, setWidthState] = useState(loadWidth);

  const setWidth = (px) => setWidthState(clamp(px));

  // remember the width between visits
  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch {
      /* storage unavailable, ignore */
    }
  }, [width]);

  // after hiding with a click, keep hover-reveal off until the pointer leaves the icon
  useEffect(() => {
    if (!peekLocked) return;
    const onMove = (e) => {
      const overZone =
        e.target instanceof Element && e.target.closest("[data-peek-zone]");
      if (!overZone) setPeekLocked(false);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [peekLocked]);

  const isOpen = isDesktop ? desktopOpen : drawerOpen;

  const toggle = () => {
    setPeek(false);
    if (isDesktop) {
      setPeekLocked(desktopOpen);
      setDesktopOpen((v) => !v);
    } else {
      setDrawerOpen((v) => !v);
    }
  };
  const closeDrawer = () => setDrawerOpen(false);
  const startPeek = () => {
    if (!peekLocked) setPeek(true);
  };
  const endPeek = () => setPeek(false);

  return {
    isDesktop, isOpen, toggle, closeDrawer,
    peek, startPeek, endPeek,
    width, setWidth,
  };
}