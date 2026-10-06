import { useEffect, useRef, useState } from "react";
import useMediaQuery from "../../hooks/useMediaQuery";

export default function ChatInput({ onSend, disabled = false, autoFocus = false }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);
  // phones and tablets: Enter makes a new line, the arrow button sends
  const isTouch = useMediaQuery("(pointer: coarse)");

    // when the box is unlocked again, put the cursor back in it
  const wasDisabled = useRef(disabled);
  useEffect(() => {
    if (wasDisabled.current && !disabled) ref.current?.focus();
    wasDisabled.current = disabled;
  }, [disabled]);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(resize);
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
        maxLength={4000}
        enterKeyHint="enter"
        autoFocus={autoFocus}        
        onChange={(e) => {
          setValue(e.target.value);
          resize();          
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? "Waiting for the reply..." : "Ask anything..."}
        className="max-h-[200px] w-full resize-none bg-transparent px-1 text-zinc-100 placeholder-zinc-500 outline-none"
      />
      <div className="mt-2 flex justify-end">
        <button
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