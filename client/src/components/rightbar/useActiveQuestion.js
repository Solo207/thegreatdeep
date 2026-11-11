import { useCallback, useEffect, useRef, useState } from "react";

const LINE = 40; // px below the top edge of the chat: the question at or above this line is "current"
const PAUSE_MS = 900; // after tapping a row, don't re-measure while the smooth scroll is running

export default function useActiveQuestion(enabled) {
  const [spy, setSpy] = useState({ id: null, index: 0 });
  const pausedUntil = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const scroller = document.querySelector("[data-chat-scroller]");
    if (!scroller) return;
    let frame = 0;

    const compute = () => {
      frame = 0;
      if (Date.now() < pausedUntil.current) return;
      const els = scroller.querySelectorAll("[data-user-message]");
      if (!els.length) return;
      const line = scroller.getBoundingClientRect().top + LINE;
      let index = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= line) index = i;
      });
      const id = els[index].dataset.messageId ?? null;
      setSpy((prev) => (prev.index === index && prev.id === id ? prev : { id, index }));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    scroller.addEventListener("scroll", schedule, { passive: true });
    // a new question was added: look again
    const column = scroller.firstElementChild;
    const observer = new MutationObserver(schedule);
    if (column) observer.observe(column, { childList: true });
    schedule();

    return () => {
      scroller.removeEventListener("scroll", schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  // a row was tapped: mark it at once
  const choose = useCallback((id, index) => {
    pausedUntil.current = Date.now() + PAUSE_MS;
    setSpy({ id, index });
  }, []);

  return { spy, choose };
}