import { useEffect, useRef, useState } from "react";
import useMediaQuery from "../../hooks/useMediaQuery";
import { FOCUS_EVENT } from "../../lib/keyboard";
import useKeyboardOpen from "../../hooks/useKeyboardOpen";

const MAX_LENGTH = 4000;

export default function ChatInput({ onSend, disabled = false, autoFocus = false, onFocusChange }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);
  // phones and tablets: Enter makes a new line, the arrow button sends
  const isTouch = useMediaQuery("(pointer: coarse)");
  const keyboardOpen = useKeyboardOpen();

  // keep the box tall enough for what is typed
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

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

  return (
    <div
      // clicking anywhere in the box (not just the first line) focuses the text
      onClick={(e) => {
        if (!e.target.closest("button")) ref.current?.focus();
      }}
      className="w-full cursor-text rounded-2xl border border-zinc-700 bg-zinc-800 p-3 shadow-lg transition-colors focus-within:border-zinc-500"
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        maxLength={MAX_LENGTH}
        enterKeyHint="enter"
        autoFocus={autoFocus}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Waiting for the reply..." : "Ask anything..."}
        className="max-h-[200px] w-full resize-none bg-transparent px-1 text-zinc-100 placeholder-zinc-500 outline-none disabled:cursor-not-allowed disabled:placeholder-zinc-600"
      />
      <div className="mt-2 flex justify-end">
          <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-indigo-500 text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
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
    </div>
  );
}