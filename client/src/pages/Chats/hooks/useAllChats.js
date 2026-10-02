import { useEffect, useState } from "react";
import { getHistory } from "../../../lib/api/chats";

export default function useAllChats() {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [chats, setChats] = useState([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    getHistory(true) // all = true: every chat, not just the latest 20
      .then((data) => {
        if (ignore) return;
        setChats(data.chats);
        setStatus("ready");
      })
      .catch(() => {
        if (ignore) return;
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  return { status, chats, retry };
}