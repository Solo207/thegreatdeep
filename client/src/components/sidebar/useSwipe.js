import { useEffect, useRef } from "react";

const MIN_DISTANCE = 60; // px the finger must travel sideways
const MAX_SLOPE = 0.6;   // how diagonal a swipe may be (sideways must clearly win)

// Touches that belong to something else: text fields, pop-ups, and any area that
// scrolls sideways (rows of sets, wide tables, code blocks).
function shouldIgnore(target) {
  if (!(target instanceof Element)) return true;
  if (target.closest("input, textarea, select, [contenteditable], [role='dialog'], [data-no-swipe]")) {
    return true;
  }
  for (let el = target; el && el !== document.body; el = el.parentElement) {
    const { overflowX } = getComputedStyle(el);
    if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth) {
      return true;
    }
  }
  return false;
}

// Calls onSwipeRight / onSwipeLeft when a finger sweeps across the screen.
// It only listens: scrolling and taps are never interfered with.
export default function useSwipe({ onSwipeRight, onSwipeLeft }) {
  const handlers = useRef({ onSwipeRight, onSwipeLeft });
  useEffect(() => {
    handlers.current = { onSwipeRight, onSwipeLeft }; // always the latest, without re-subscribing
  });

  useEffect(() => {
    let start = null;

    const onStart = (e) => {
      if (e.touches.length !== 1 || shouldIgnore(e.target)) {
        start = null;
        return;
      }
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onEnd = (e) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      start = null;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dy) > Math.abs(dx) * MAX_SLOPE) return;
      if (dx > 0) handlers.current.onSwipeRight?.();
      else handlers.current.onSwipeLeft?.();
    };

    const onCancel = () => {
      start = null;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onCancel);
    };
  }, []);
}