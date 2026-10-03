import { useEffect, useState } from "react";

// Height of the part of the page you can actually see.
// On phones this shrinks when the keyboard opens, so the layout shrinks with it.
export default function useVisualViewportHeight() {
  const [height, setHeight] = useState(
    () => window.visualViewport?.height ?? window.innerHeight
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      if (vv.scale > 1.01) return; // ignore pinch-zoom
      setHeight(vv.height);
      window.scrollTo(0, 0); // iOS nudges the page up when the keyboard opens; undo it
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}