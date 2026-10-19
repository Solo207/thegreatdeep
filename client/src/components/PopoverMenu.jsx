import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 4; // between the button and the menu
const EDGE = 8; // never closer than this to the screen edge
const PADDING = 8; // the box's own padding

// A small floating menu next to an element. It measures itself, so it always fits:
// below the element if there is room, above if that is roomier, and it scrolls
// inside itself if it is still too tall.
export default function PopoverMenu({ rect, width = 224, onClose, children }) {
  const innerRef = useRef(null);
  const openedAt = useRef(Date.now());
  const [pos, setPos] = useState(null);

  const place = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const natural = inner.offsetHeight + PADDING;
    const below = window.innerHeight - rect.bottom - GAP - EDGE;
    const above = rect.top - GAP - EDGE;

    let top;
    let maxHeight;
    if (natural <= below || (natural > above && below >= above)) {
      top = rect.bottom + GAP;
      maxHeight = below;
    } else {
      maxHeight = above;
      top = rect.top - GAP - Math.min(natural, above);
    }
    const left = Math.max(EDGE, Math.min(rect.left, window.innerWidth - width - EDGE));
    setPos({ top: Math.max(EDGE, top), left, maxHeight: Math.max(120, maxHeight) });
  }, [rect, width]);

  // measure before the first paint, so it never flashes in the wrong place
  useLayoutEffect(() => {
    place();
  }, [place]);

  // and again whenever the content changes size (e.g. a list opens inside it)
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const observer = new ResizeObserver(place);
    observer.observe(inner);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [place]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ignores the tap that ends a long press, so the menu doesn't close the moment it opens
  const closeFromBackdrop = () => {
    if (Date.now() - openedAt.current > 350) onClose();
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-60"
        onClick={closeFromBackdrop}
        onContextMenu={(e) => {
          e.preventDefault();
          closeFromBackdrop();
        }}
      />
      <div
        role="menu"
        style={{
          top: pos?.top ?? 0,
          left: pos?.left ?? 0,
          width,
          maxHeight: pos?.maxHeight,
          visibility: pos ? "visible" : "hidden",
          animation: pos ? "fade-in 120ms ease-out" : undefined,
        }}
        className="fixed z-61 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 text-sm text-zinc-100 shadow-2xl"
      >
        <div ref={innerRef}>{children}</div>
      </div>
    </>,
    document.body
  );
}