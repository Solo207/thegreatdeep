import { useEffect, useState } from "react";
import { getAllChats } from "../../../lib/api/chatActions";

export default function useAllChats() {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [chats, setChats] = useState([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    getAllChats() // asks n8n's all_chats: every chat
      .then((list) => {
        if (ignore) return;
        setChats(list);
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

  return { status, chats, setChats, retry };
}