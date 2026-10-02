import { useEffect, useRef, useState } from "react";
import { getChat, sendMessage } from "../../../lib/api/chats";

export default function useChat(chatId, firstMessage = null, onReply = null) {
  // loading history (skipped for a brand new chat, which has none)
  const [status, setStatus] = useState(firstMessage ? "ready" : "loading"); // loading | ready | error
  const [errorKind, setErrorKind] = useState(null);
  const [messages, setMessages] = useState(() =>
    firstMessage
      ? [{ id: crypto.randomUUID(), role: "user", content: firstMessage }]
      : []
  );
  const [attempt, setAttempt] = useState(0);

  // sending
  const [isSending, setIsSending] = useState(Boolean(firstMessage));
  const [sendError, setSendError] = useState(null);
  const [failedText, setFailedText] = useState(null);

  const startedRef = useRef(false);

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

  // ask the server for a reply to `text`
  async function deliver(text) {
    setIsSending(true);
    setSendError(null);
    try {
      const reply = await sendMessage(chatId, text);
      setMessages((prev) => [...prev, reply]);
      onReply?.();
    } catch (err) {
      setSendError(err.kind ?? "failed");
      setFailedText(text);
    } finally {
      setIsSending(false);
    }
  }

  // a new message from the user
  const send = (text) => {
    if (isSending) return;
    setFailedText(null);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);
    deliver(text);
  };

  // resend the message that failed (its bubble is already on screen)
  const retrySend = () => {
    if (isSending || failedText === null) return;
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
    isSending,
    sendError,
    retrySend,
  };
}