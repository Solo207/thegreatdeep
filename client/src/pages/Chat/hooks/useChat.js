import { useEffect, useRef, useState } from "react";
import { getChat, sendMessage } from "../../../lib/api/chats";
import { useEvents } from "../../../components/events/events-context";

// false: you can keep typing and sending while n8n is still working.
// true:  the input is locked until a reply arrives.
const LOCK_INPUT_WHILE_WAITING = true;

export default function useChat(chatId, firstMessage = null, onReply = null) {
  const { subscribe } = useEvents();

  // loading history (skipped for a brand new chat, which has none)
  const [status, setStatus] = useState(firstMessage ? "ready" : "loading"); // loading | ready | error
  const [errorKind, setErrorKind] = useState(null);
  const [messages, setMessages] = useState(() =>
    firstMessage
      ? [{ id: crypto.randomUUID(), role: "user", content: firstMessage }]
      : []
  );
  const [attempt, setAttempt] = useState(0);

  // waiting for n8n
  const [isWaiting, setIsWaiting] = useState(Boolean(firstMessage));
  const [words, setWords] = useState([]);
  const [sendError, setSendError] = useState(null);
  const [failedText, setFailedText] = useState(null);

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
  // however many arrive. Messages for other chats are ignored here.
  useEffect(() => {
    return subscribe((evt) => {
      if (evt.chatId !== chatId) return;

      if (evt.type === "reply") {
        // a message from n8n goes to the bottom, however many arrive
        if (evt.message) {
          setMessages((prev) => [
            ...prev,
            { ...evt.message, key: crypto.randomUUID() },
          ]);
        }
        // only the final callback ("done": true) ends the waiting
        if (evt.done) {
          setIsWaiting(false);
          setWords([]);
        }
      } else if (evt.type === "reply_failed") {
        setIsWaiting(false);
        setWords([]);
        setSendError("failed");
        setFailedText(lastSentRef.current); // so Retry can resend it
      }
    });
  }, [subscribe, chatId]);

  // send the first message, exactly once
  useEffect(() => {
    if (!firstMessage || startedRef.current) return;
    startedRef.current = true;
    deliver(firstMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  // hand `text` to the server
  async function deliver(text) {
    lastSentRef.current = text;
    setIsWaiting(true);
    setWords([]);
    setSendError(null);
    try {
      const result = await sendMessage(chatId, text);
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
      setFailedText(text);
      setIsWaiting(false);
    }
  }

  // a new message from the user
  const send = (text) => {
    if (LOCK_INPUT_WHILE_WAITING && isWaiting) return;
    setFailedText(null);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);
    deliver(text);
  };

  // resend the message that failed (its bubble is already on screen)
  const retrySend = () => {
    if (failedText === null) return;
    const text = failedText;
    setFailedText(null);
    deliver(text);
  };

  return {
    status,
    errorKind,
    messages,
    retry,
    send,
    isWaiting,
    inputLocked: LOCK_INPUT_WHILE_WAITING && isWaiting,
    words,
    sendError,
    retrySend,
  };
}