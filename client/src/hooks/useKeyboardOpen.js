import { useEffect, useState } from "react";

// true while a phone keyboard seems to be open (the visible area is much shorter than usual)
export default function useKeyboardOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let tallest = vv.height;
    const update = () => {
      tallest = Math.max(tallest, vv.height);
      setOpen(tallest - vv.height > 120);
    };
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  return open;
}