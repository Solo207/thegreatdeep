import { useEffect, useRef } from "react";
import { forgetTyping, restoreTyping } from "../lib/keyboard";

/**
 * While a menu next to the text box is open, the keyboard stays exactly as it was.
 * `stamp` changes when the menu redraws; `paused` is for a pop-up that should hold the keyboard itself.
 */
export default function useKeepTyping(open, stamp = "", paused = false) {
  const active = useRef(false);
  useEffect(() => {
    if (open && !paused) {
      active.current = true;
      restoreTyping(); // the menu may have taken focus when it appeared
    } else if (!open && active.current) {
      active.current = false;
      restoreTyping(); // menu closed: back to how it was
      forgetTyping();
    }
  }, [open, stamp, paused]);
}