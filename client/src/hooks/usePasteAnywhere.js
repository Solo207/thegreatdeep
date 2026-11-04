import { useEffect } from "react";
import { chatFocusBlocked } from "../lib/keyboard";

const isEditable = (el) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export default function usePasteAnywhere(inputRef) {
  useEffect(() => {
    const onPaste = (e) => {
      const el = inputRef.current;
      if (!el || el.disabled || el.readOnly) return;
      if (chatFocusBlocked() || e.defaultPrevented || isEditable(e.target)) return;

      const text = e.clipboardData?.getData("text/plain");
      if (!text) return; // an image or file: leave it alone

      e.preventDefault();
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      if (!document.execCommand("insertText", false, text)) {
        // fallback that a controlled textarea still notices
        const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
        set.call(el, el.value + text);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [inputRef]);
}