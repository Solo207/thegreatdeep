import { useEffect, useRef, useState } from "react";

const NEAR_BOTTOM_PX = 80;  // closer than this counts as "at the bottom"
const SHOW_BUTTON_PX = 300; // scrolled further up than this (about 3 messages) shows the arrow

export default function MessageList({ messages, isLoading }) {
  const scrollerRef = useRef(null);
  const nearBottomRef = useRef(true);
  const firstRenderRef = useRef(true);
  const [showButton, setShowButton] = useState(false);

  const scrollToBottom = (behavior = "smooth") => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = distance < NEAR_BOTTOM_PX;
    setShowButton(distance > SHOW_BUTTON_PX);
  };

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      scrollToBottom("auto"); // opening a chat: jump straight to the end
    } else if (last?.role === "user" || nearBottomRef.current) {
      scrollToBottom("smooth"); // you just sent something, or you're already at the end
    }
  }, [messages, isLoading]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 ${
                  m.role === "user"
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-zinc-800 px-4 py-4">
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      {showButton && (
        <button
          onClick={() => scrollToBottom("smooth")}
          aria-label="Scroll to latest message"
          className="absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-200 shadow-lg transition-colors hover:bg-zinc-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}