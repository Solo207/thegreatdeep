import { useRef } from "react";
import useLongPress from "./sidebar/useLongPress";
import { cursorRect } from "../lib/rect";

// Wrap a row in this. onOpen(rect) is called with where the menu should appear.
//  - mouse: 3 dots appear while hovering
//  - touch screen: a long press (no dots)
//  - right click: anywhere, opens at the mouse
export default function MenuRow({ onOpen, label = "Options", children }) {
  const rowRef = useRef(null);

  const longPress = useLongPress(
    () => {
      if (rowRef.current) onOpen(rowRef.current.getBoundingClientRect());
    },
    (e) => onOpen(cursorRect(e, rowRef.current))
  );

  return (
    <div
      ref={rowRef}
      className="group relative [-webkit-touch-callout:none] [@media(hover:none)]:select-none"
      {...longPress}
    >
      {children}
      <button
        onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
        aria-label={label}
        className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-800 hover:text-zinc-100 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
        >
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>
    </div>
  );
}