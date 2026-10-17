import { useContext } from "react";
import { createPortal } from "react-dom";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";
import { HeaderSlotContext } from "../../components/header-slot-context";

// The chat's title: "roughbook name / chat title", or just the title.
// With the sidebar closed it sits in the top strip, on the same line as the sidebar
// button. With the sidebar open it is a slim bar above the chat.
export default function ChatHeader({ title, rough }) {
  const slot = useContext(HeaderSlotContext);

  const text = (
    <div className="flex min-w-0 items-center gap-2 text-sm">
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
    </div>
  );

  if (slot) return createPortal(text, slot);

  return (
    <div className="shrink-0 border-b border-zinc-800 px-4 py-2.5">
      <div className={`mx-auto w-full ${CHAT_MAX_WIDTH}`}>{text}</div>
    </div>
  );
}