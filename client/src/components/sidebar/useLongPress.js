import { useRef } from "react";

const HOLD_MS = 500; // how long a finger must stay down
const MOVE_TOLERANCE = 10; // px the finger may drift (more than that is a scroll)

// Long press for touch screens, and right click for a mouse. Spread the result on the element:
//   <div {...useLongPress(onLongPress, onRightClick)}>
// A tap right after a long press is swallowed, so the link doesn't open too.
export default function useLongPress(onLongPress, onRightClick) {
  const timer = useRef(null);
  const start = useRef(null);
  const fired = useRef(false);

  const cancel = () => {
    clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  };

  return {
    onPointerDown: (e) => {
      if (e.pointerType !== "touch") return;
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        fired.current = true;
        start.current = null;
        onLongPress();
      }, HOLD_MS);
    },
    onPointerMove: (e) => {
      if (!start.current) return;
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_TOLERANCE) {
        cancel();
      }
    },
    onPointerUp: cancel,
    onPointerCancel: cancel, // the browser started scrolling
    onPointerLeave: cancel,
    onContextMenu: (e) => {
      // a long press on a phone also sends this: the timer above handles it
      if (fired.current || timer.current) {
        e.preventDefault();
        return;
      }
      // a right click with a mouse: open the menu at the mouse
      if (onRightClick) {
        e.preventDefault();
        onRightClick(e);
      }
    },
    onClickCapture: (e) => {
      if (fired.current) {
        e.preventDefault();
        e.stopPropagation();
        fired.current = false;
      }
    },
  };
}