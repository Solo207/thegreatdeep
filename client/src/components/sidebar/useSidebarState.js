import { useEffect, useState } from "react";
import useMediaQuery from "../../hooks/useMediaQuery";
import { SIDEBAR_BREAKPOINT } from "./config";

export default function useSidebarState() {
  const isDesktop = useMediaQuery(`(min-width: ${SIDEBAR_BREAKPOINT}px)`);
  const [desktopOpen, setDesktopOpen] = useState(true); // pinned open on big screens
  const [drawerOpen, setDrawerOpen] = useState(false);  // drawer on small screens
  const [peek, setPeek] = useState(false);              // temporary hover reveal
  const [peekLocked, setPeekLocked] = useState(false);  // hover reveal switched off for now

  // After hiding the sidebar with a click, the mouse is still sitting on the
  // icon. Keep hover-reveal off until the pointer has moved away from it.
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
      setPeekLocked(desktopOpen); // hiding: lock hover-reveal. showing: unlock.
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

  return { isDesktop, isOpen, toggle, closeDrawer, peek, startPeek, endPeek };
}