import { useEffect, useRef, useState } from "react";
import { getChat, sendMessage } from "../../../lib/api/chats";
import { useEvents } from "../../../components/events/events-context";
import { neighborsFor } from "../../../lib/neighbors";

// true: the input is locked until n8n sends "done". false: you can keep sending.
const LOCK_INPUT_WHILE_WAITING = true;

const refreshOutline = () => window.dispatchEvent(new Event("outline:refresh"));

const userMessage = (text) => ({
  id: crypto.randomUUID(),
  role: "user",
  type: "text",
  createdAt: "just now",
  content: { body: text },
});

export default function useChat(chatId, firstMessage = null, onReply = null) {
  const { subscribe } = useEvents();

  // loading history (skipped for a brand new chat, which has none)
  const [status, setStatus] = useState(firstMessage ? "ready" : "loading"); // loading | ready | error
  const [errorKind, setErrorKind] = useState(null);
  const [messages, setMessages] = useState(() =>
    firstMessage ? [userMessage(firstMessage)] : []
  );
  const [attempt, setAttempt] = useState(0);
  const [meta, setMeta] = useState(null); // { id, title, rough } from the server

  // waiting for n8n
  const [isWaiting, setIsWaiting] = useState(Boolean(firstMessage));
  const [words, setWords] = useState([]);
  const [sendError, setSendError] = useState(null);
  const [failed, setFailed] = useState(null); // { text, selection, neighbors } of the send that failed

  const startedRef = useRef(false);
  const lastSentRef = useRef(null);

  // load history (not needed when we arrive with a first message)
  useEffect(() => {
    if (firstMessage) return;
    let ignore = false;

    getChat(chatId)
      .then((data) => {
        if (ignore) return;
        setMessages(data.messages);
        setMeta(data.chat ?? null);
        if (data.pending) {
          // n8n is still working on this chat: lock again and show the same words
          setIsWaiting(true);
          setWords(data.pending.words ?? []);
        }
        setStatus("ready");
      })
      .catch((err) => {
        if (ignore) return;
        setErrorKind(err.kind ?? "failed");
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [chatId, attempt, firstMessage]);

  // Every message pushed by the server for THIS chat goes to the bottom,
  // however many arrive. Only a message carrying "done" ends the waiting.
  useEffect(() => {
    return subscribe((evt) => {
      if (evt.chatId !== chatId) return;

      if (evt.type === "reply") {
        if (evt.message) {
          setMessages((prev) => [...prev, { ...evt.message, key: crypto.randomUUID() }]);
        }
        if (evt.done) {
          setIsWaiting(false);
          setWords([]);
          refreshOutline(); // the reply is finished, so the "On this page" list may have changed
        }
      } else if (evt.type === "reply_failed") {
        setIsWaiting(false);
        setWords([]);
        setSendError("failed");
        setFailed(lastSentRef.current); // so Retry can resend it (neighbours included)
      }
    });
  }, [subscribe, chatId]);

  // send the first message, exactly once
  useEffect(() => {
    if (!firstMessage || startedRef.current) return;
    startedRef.current = true;
    // a brand new chat: nothing came before this message, so there are no neighbours
    deliver(firstMessage, null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  // hand a message to the server
  async function deliver(text, selection = null, neighbors = null) {
    lastSentRef.current = { text, selection, neighbors };
    setIsWaiting(true);
    setWords([]);
    setSendError(null);
    try {
      const result = await sendMessage(chatId, text, selection, neighbors);
      refreshOutline(); // the "On this page" list asks n8n (/rightsb) again
      if (result.message) {
        // old synchronous workflow: the reply is already here
        setMessages((prev) => [...prev, result.message]);
        setIsWaiting(false);
        onReply?.();
      } else {
        // asynchronous workflow: replies arrive through the event stream
        setWords(result.words ?? []);
      }
    } catch (err) {
      setSendError(err.kind ?? "failed");
      setFailed({ text, selection, neighbors });
      setIsWaiting(false);
    }
  }

  // a new message from the user (typed, or a tapped button or list row)
  const send = (text, selection = null) => {
    if (LOCK_INPUT_WHILE_WAITING && isWaiting) return;
    setFailed(null);

    // work out the neighbours BEFORE the new message is added to the list,
    // otherwise the last message would be the one we are sending
    const neighbors = neighborsFor(messages);

    setMessages((prev) => [...prev, userMessage(text)]);
    deliver(text, selection, neighbors);
  };

  // resend the message that failed (its bubble is already on screen)
  const retrySend = () => {
    if (!failed) return;
    const { text, selection, neighbors } = failed;
    setFailed(null);
    // reuse the neighbours from the original send: the failed bubble is already
    // in the list now, so computing them again would pick up that bubble
    deliver(text, selection, neighbors);
  };

  return {
    status,
    errorKind,
    messages,
    meta,
    retry,
    send,
    isWaiting,
    inputLocked: LOCK_INPUT_WHILE_WAITING && isWaiting,
    words,
    sendError,
    retrySend,
  };
}