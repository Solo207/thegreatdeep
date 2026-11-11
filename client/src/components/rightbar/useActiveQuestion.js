import { useCallback, useEffect, useRef, useState } from "react";

const LINE = 40; // px below the top edge of the chat: a listed question at or above this line has been reached
const PAUSE_MS = 900; // after tapping a row, don't re-measure while the smooth scroll runs

export default function useActiveQuestion(enabled, links) {
  const [currentId, setCurrentId] = useState(null);
  const pausedUntil = useRef(0);
  const key = links.map((l) => l.id).join("|"); // changes when the list changes

  useEffect(() => {
    if (!enabled) return;
    const scroller = document.querySelector("[data-chat-scroller]");
    if (!scroller) return;
    const listed = new Set(key ? key.split("|") : []);
    let frame = 0;

    const compute = () => {
      frame = 0;
      if (Date.now() < pausedUntil.current) return;
      const line = scroller.getBoundingClientRect().top + LINE;
      let found = null;
      // messages are in chat order, so the last listed one above the line wins
      scroller.querySelectorAll("[data-user-message]").forEach((el) => {
        const id = el.dataset.messageId;
        if (id && listed.has(id) && el.getBoundingClientRect().top <= line) found = id;
      });
      // nothing new reached the line: the current row stays highlighted
      if (found) setCurrentId((prev) => (prev === found ? prev : found));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    scroller.addEventListener("scroll", schedule, { passive: true });
    const column = scroller.firstElementChild;
    const observer = new MutationObserver(schedule); // a question was added
    if (column) observer.observe(column, { childList: true });
    schedule();

    return () => {
      scroller.removeEventListener("scroll", schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, key]);

  // a row was tapped: mark it at once
  const choose = useCallback((id) => {
    pausedUntil.current = Date.now() + PAUSE_MS;
    setCurrentId(id);
  }, []);

  return { currentId, choose };
}