import { Fragment, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { splitLinks } from "../../lib/links";
import useMediaQuery from "../../hooks/useMediaQuery";
import { FOCUS_EVENT } from "../../lib/keyboard";
import useKeyboardOpen from "../../hooks/useKeyboardOpen";
import useChatOptions from "../../hooks/useChatOptions";
import PlusMenu from "./options/PlusMenu";
import EffortPill from "./options/EffortPill";
import usePasteAnywhere from "../../hooks/usePasteAnywhere";

const MAX_LENGTH = 4000;
// marks web addresses in the box with a light highlight while you type (false turns it off)
const HIGHLIGHT_LINKS = true;

export default function ChatInput({
  onSend,
  disabled = false,
  autoFocus = false,
  onFocusChange,
}) {
  const [value, setValue] = useState("");
  const ref = useRef(null);
  const mirrorRef = useRef(null);

  const { chatId } = useParams(); // undefined on /new and /roughbook/:rbId
  const chat = useChatOptions(chatId);

  // pasting anywhere on the page goes into the box
  usePasteAnywhere(ref);

  // phones and tablets: Enter makes a new line, the arrow button sends
  const isTouch = useMediaQuery("(pointer: coarse)");
  const keyboardOpen = useKeyboardOpen();

  // keep the box tall enough for what is typed
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!value) {
      el.style.height = ""; // empty: one row, whatever the placeholder says (a long one can wrap on a phone)
      return;
    }
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value, disabled]);

  // when the box is unlocked again, put the cursor back in it (computers only)
  const wasDisabled = useRef(disabled);
  useEffect(() => {
    if (wasDisabled.current && !disabled && !isTouch) ref.current?.focus();
    wasDisabled.current = disabled;
  }, [disabled, isTouch]);

  // the app can ask this box to take focus (only the /new box listens)
  useEffect(() => {
    if (!autoFocus) return;
    const focus = () => ref.current?.focus();
    window.addEventListener(FOCUS_EVENT, focus);
    return () => window.removeEventListener(FOCUS_EVENT, focus);
  }, [autoFocus]);

  // On /new a phone should always be ready to type: tapping an empty part of the page
  // brings up the keyboard, every time.
  useEffect(() => {
    if (!autoFocus || !isTouch) return;

    const onTap = (e) => {
      // a menu or a pop-up is open: taps around it are not "empty space"
      if (document.querySelector("[role='menu'], [role='dialog']")) return;

      // taps on buttons, links, fields and the sidebar do their own thing
      const onControl =
        e.target instanceof Element &&
        e.target.closest("button, a, input, textarea, select, label, aside, [role='dialog']");
      if (onControl) return;

      const el = ref.current;
      if (!el || el.disabled) return;

      if (document.activeElement === el) {
        if (keyboardOpen) return; // the keyboard is already showing
        el.blur(); // focused but the keyboard was hidden: reset so it opens again
      }
      el.focus();
    };

    window.addEventListener("click", onTap, true);
    return () => window.removeEventListener("click", onTap, true);
  }, [autoFocus, isTouch, keyboardOpen]);

  // type anywhere: pressing a letter or number while nothing else is being typed
  // into sends it to this box
  useEffect(() => {
    if (disabled) return;
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!/^[\p{L}\p{N}]$/u.test(e.key)) return;
      const active = document.activeElement;
      if (active?.matches?.("input, textarea, select, [contenteditable]")) return;
      if (document.querySelector('[role="dialog"]')) return; // a pop-up is open
      e.preventDefault();
      ref.current?.focus();
      setValue((v) => (v + e.key).slice(0, MAX_LENGTH));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (isTouch) return; // let the phone keyboard's Enter add a new line
    // computer: Enter sends, Shift+Enter makes a new line
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  // one row, always: [ + ] [ text ] [ Effort ] [ send ]
  return (
    <div
      // clicking anywhere in the box (not just the first line) focuses the text
      onClick={(e) => {
        if (!e.target.closest("button, input, [role='menu'], [role='dialog']")) ref.current?.focus();
      }}
      className="flex w-full cursor-text items-end gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 p-2 pl-3 shadow-lg transition-colors focus-within:border-zinc-500"
    >
      <div className="flex shrink-0 items-center self-center">
        <PlusMenu chat={chat} />
      </div>

      {/* the wrapper takes the free space; the mirror and the textarea share the same padding so the link highlight lines up */}
      <div className="relative min-w-0 flex-1">
        {HIGHLIGHT_LINKS && (
          <div
            ref={mirrorRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-y-hidden whitespace-pre-wrap wrap-break-word px-1 py-1.5 text-transparent"
          >
            {splitLinks(value).map((part, i) =>
              part.href ? (
                <span
                  key={i}
                  className="rounded-sm bg-indigo-400/20 underline decoration-indigo-300 underline-offset-2"
                >
                  {part.text}
                </span>
              ) : (
                <Fragment key={i}>{part.text}</Fragment>
              )
            )}
            {"\u200b"}
          </div>
        )}
        <textarea
          ref={ref}
          data-chat-input="true"
          rows={1}
          value={value}
          maxLength={MAX_LENGTH}
          enterKeyHint="enter"
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          onScroll={(e) => {
            if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
          placeholder={disabled ? "Waiting for reply..." : "Ask anything..."}          className="relative max-h-50 w-full min-w-0 flex-1 resize-none bg-transparent px-1 py-1.5 text-zinc-100 placeholder-zinc-500 outline-none disabled:cursor-not-allowed disabled:placeholder-zinc-600"
        />
      </div>

      <div className="flex h-9 shrink-0 items-center whitespace-nowrap">
        <EffortPill chat={chat} />
      </div>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-indigo-500 text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
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
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}