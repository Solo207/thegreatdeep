import { Fragment, useEffect, useRef, useState } from "react";
import BotMessage from "./messages/BotMessage";
import MessageBoundary from "./messages/MessageBoundary";
import WaitingIndicator from "./WaitingIndicator";
import { bodyOf } from "./messages/utils";
import { CHAT_MAX_WIDTH } from "./config";
import LinkedText from "./LinkedText";
import MessageMeta from "./messages/MessageMeta";

const NEAR_BOTTOM_PX = 80;  // closer than this to the end counts as "at the end"
const SHOW_BUTTON_PX = 300; // further than this from the end shows the arrow (about 3 messages)
const ANCHOR_OFFSET = 16;   // gap above your message when it is moved to the top
const PAD_BOTTOM = 24;      // the list's bottom padding (py-6)

// where an element starts inside the scrolling area
const topOf = (el, scroller) =>
  el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

export default function MessageList({ messages, isLoading, words = [], onSelect }) {
  const scrollerRef = useRef(null);
  const columnRef = useRef(null);
  const spacerRef = useRef(null);
  const endRef = useRef(null);
  const lastUserRef = useRef(null);
  const firstRenderRef = useRef(true);
  const prevCountRef = useRef(0);
  const unseenRef = useRef(false);
  const [showButton, setShowButton] = useState(false);

  // how far the end of the conversation is below the visible area
  const distanceFromEnd = () => {
    const s = scrollerRef.current;
    const e = endRef.current;
    if (!s || !e) return 0;
    return Math.max(0, topOf(e, s) - (s.scrollTop + s.clientHeight));
  };

  // Blank room under the newest reply, just enough that your latest message can sit
  // at the top of the screen. It shrinks as the reply grows, so nothing jumps.
  const updateSpacer = () => {
    const s = scrollerRef.current;
    const spacer = spacerRef.current;
    const end = endRef.current;
    if (!s || !spacer || !end) return;
    const userEl = lastUserRef.current;
    if (!userEl) {
      spacer.style.height = "0px";
      return;
    }
    const anchorTop = topOf(userEl, s) - ANCHOR_OFFSET;
    const needed = anchorTop + s.clientHeight - topOf(end, s) - PAD_BOTTOM;
    spacer.style.height = `${Math.max(0, needed)}px`;
  };

  const scrollToEnd = (behavior = "smooth") => {
    const s = scrollerRef.current;
    const e = endRef.current;
    if (!s || !e) return;
    s.scrollTo({ top: Math.max(0, topOf(e, s) + PAD_BOTTOM - s.clientHeight), behavior });
  };

  const handleScroll = () => {
    const d = distanceFromEnd();
    if (d <= NEAR_BOTTOM_PX) unseenRef.current = false;
    // after a message lands out of sight, the arrow stays until you reach the end
    setShowButton(d > (unseenRef.current ? NEAR_BOTTOM_PX : SHOW_BUTTON_PX));
  };

  // keep the blank room right when the window or the content changes size
  useEffect(() => {
    const s = scrollerRef.current;
    const column = columnRef.current;
    if (!s || !column) return;
    const observer = new ResizeObserver(() => updateSpacer());
    observer.observe(s);
    observer.observe(column);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = scrollerRef.current;
    if (!s) return;
    updateSpacer();

    const grew = messages.length > prevCountRef.current;
    prevCountRef.current = messages.length;
    const last = messages[messages.length - 1];

    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      scrollToEnd("auto"); // opening a chat: show the end of the conversation
    } else if (grew && last?.role === "user") {
      // you just sent something: move it to the top so the reply flows down below it
      if (lastUserRef.current) {
        s.scrollTo({
          top: Math.max(0, topOf(lastUserRef.current, s) - ANCHOR_OFFSET),
          behavior: "smooth",
        });
      }
    } else if (grew) {
      // a message arrived: leave the screen exactly where it is
      requestAnimationFrame(() => {
        if (distanceFromEnd() > NEAR_BOTTOM_PX) {
          unseenRef.current = true;
          setShowButton(true);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading]);

  // the waiting line goes right under the user's latest message,
  // so the bot's messages appear below it as they arrive
  let lastUserIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUserIndex = i;
      break;
    }
  }
  const indicatorAfter = lastUserIndex === -1 ? messages.length - 1 : lastUserIndex;
    // the text the user sent right after message i (if the next message is theirs)
  const nextText = (i) =>
    messages[i + 1]?.role === "user" ? bodyOf(messages[i + 1]) : null;

    // The last message of each run of bot messages (the one before your next message,
  // or the newest in the chat) carries the copy icon and time. Copy takes the whole run.
  const isRunEnd = (i) => messages[i + 1] === undefined || messages[i + 1].role === "user";
  const runText = (i) => {
    const parts = [];
    for (let j = i; j >= 0 && messages[j].role !== "user"; j--) {
      const t = bodyOf(messages[j]);
      if (t) parts.unshift(t);
    }
    return parts.join("\n\n");
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-4 py-6"
      >
        <div
          ref={columnRef}
          className={`mx-auto flex w-full ${CHAT_MAX_WIDTH} flex-col gap-4`}
        >
          {messages.map((m, i) => (
            <Fragment key={m.key ?? m.id}>
              {m.role === "user" ? (
                <div
                  ref={i === lastUserIndex ? lastUserRef : null}
                  className="flex justify-end"
                >
                  <div className="flex max-w-[85%] flex-col items-end">
                    <div className="whitespace-pre-wrap wrap-anywhere rounded-2xl bg-indigo-500 px-4 py-2.5 text-white">
                      <LinkedText
                        text={bodyOf(m)}
                        linkClass="underline decoration-white/60 underline-offset-2 hover:decoration-white"
                      />
                    </div>
                                        <MessageMeta text={bodyOf(m)} createdAt={m.createdAt} align="right" />
                  </div>
                </div>
              ) : (
                  <div className="min-w-0 px-1 text-zinc-100">
                  <MessageBoundary>
                    <BotMessage
                      message={m}
                      // buttons, lists and questions only work while they are the newest message
                      active={i === messages.length - 1 && !isLoading}
                      // what the user sent right after this message (their choice)
                      nextUserText={nextText(i)}
                      onSelect={onSelect}
                    />
                  </MessageBoundary>
                  {isRunEnd(i) && !(isLoading && i === messages.length - 1) && (
                    <MessageMeta text={runText(i)} createdAt={m.createdAt} />
                  )}
                </div>
              )}

              {isLoading && i === indicatorAfter && <WaitingIndicator words={words} />}
            </Fragment>
          ))}

          {isLoading && messages.length === 0 && <WaitingIndicator words={words} />}
          <div ref={endRef} />
        </div>
        <div ref={spacerRef} />
      </div>

      {showButton && (
        <button
          onClick={() => scrollToEnd("smooth")}
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