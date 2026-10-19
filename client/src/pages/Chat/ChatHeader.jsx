import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";
import { HeaderSlotContext } from "../../components/header-slot-context";
import ChatActions from "../../components/sidebar/ChatActions";

// The chat's title: "roughbook name / chat title", or just the title, with a 3-dots menu
// at its right end (Pin, Rename, Delete, Roughbook).
// With the sidebar closed it sits in the top strip, on the same line as the sidebar
// button. With the sidebar open it is a slim bar above the chat.
//   chat  { id, title, rough, roughId, pin }
export default function ChatHeader({ chat }) {
  const slot = useContext(HeaderSlotContext);
  const [menu, setMenu] = useState(null); // null | { rect }
  const { title, rough } = chat;

  const text = (
    <div className="flex w-full min-w-0 items-center gap-2 text-sm">
      {rough && (
        <>
          <span className="max-w-[40%] shrink-0 truncate text-zinc-400" title={rough}>
            {rough}
          </span>
          <span className="text-zinc-600">/</span>
        </>
      )}
      <span className="min-w-0 flex-1 truncate font-bold" title={title}>
        {title}
      </span>
      <button
        onClick={(e) => setMenu({ rect: e.currentTarget.getBoundingClientRect() })}
        aria-label="Chat options"
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>
    </div>
  );

  const menuBox = menu && (
    <ChatActions chat={chat} rect={menu.rect} active onClose={() => setMenu(null)} />
  );

  if (slot) {
    return (
      <>
        {createPortal(text, slot)}
        {menuBox}
      </>
    );
  }

  return (
    <>
      <div className="shrink-0 border-b border-zinc-800 px-4 py-2.5">
        <div className={`mx-auto w-full ${CHAT_MAX_WIDTH}`}>{text}</div>
      </div>
      {menuBox}
    </>
  );
}