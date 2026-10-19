import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import useLongPress from "./useLongPress";
import ChatActions from "./ChatActions";
import { cursorRect } from "../../lib/rect";

// One chat in the sidebar: a link, a 3-dots button on hover (computers)
// and a menu on long press (phones).
export default function ChatListItem({ chat, active = false, onNavigate }) {
  const rowRef = useRef(null);
  const [menu, setMenu] = useState(null); // null | { rect }

  const openMenu = (el) => setMenu({ rect: el.getBoundingClientRect() });
  const longPress = useLongPress(
    () => {
      if (rowRef.current) openMenu(rowRef.current);
    },
    (e) => setMenu({ rect: cursorRect(e, rowRef.current) })
  );

  return (
    <div
      ref={rowRef}
      className="group relative select-none [-webkit-touch-callout:none]"
      {...longPress}
    >
      <Link
        to={`/chat/${chat.id}`}
        onClick={onNavigate}
        className={`flex w-full items-center gap-3 rounded-lg py-2 pl-3 pr-3 text-sm transition-colors group-hover:pr-9 ${
          active ? "bg-zinc-800 text-zinc-50" : "text-zinc-300 group-hover:bg-zinc-800/60"
        }`}
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full border transition-colors ${
            active
              ? "border-indigo-400 bg-indigo-400"
              : "border-zinc-600 group-hover:border-zinc-300"
          }`}
        />
        <span className="truncate">{chat.title}</span>
      </Link>

      {/* the 3 dots: only with a mouse, and only while hovering */}
      <button
        onClick={(e) => openMenu(e.currentTarget)}
        aria-label="Chat options"
        className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-opacity hover:bg-zinc-700 hover:text-zinc-100 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden ${
          menu ? "opacity-100" : "opacity-0"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      {menu && (
        <ChatActions
          chat={chat}
          rect={menu.rect}
          rough={chat.rough || ""}
          active={active}
          onClose={() => setMenu(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}