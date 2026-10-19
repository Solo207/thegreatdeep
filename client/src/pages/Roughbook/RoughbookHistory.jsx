import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRoughbookChats } from "../../lib/api/rb";
import ChatActions from "../../components/sidebar/ChatActions";
import MenuRow from "../../components/MenuRow";

// The chats inside one roughbook: title on the left, date on the right, and a
// 3-dots menu at the edge (Pin, Rename, Change roughbook, Delete).
// Tapping a row opens the chat that already exists.
export default function RoughbookHistory({ rbId, roughName }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [chats, setChats] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const [menu, setMenu] = useState(null); // null | { chat, rect }

  // the roughbook opens: ask n8n (rbhistory) for its chats
  useEffect(() => {
    let ignore = false;
    getRoughbookChats(rbId)
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
  }, [rbId, attempt]);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  // after an action: reload quietly (the list stays on screen meanwhile)
  const reload = () => setAttempt((n) => n + 1);

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-sm font-bold text-zinc-400">Chats in this roughbook</h2>

      {status === "loading" && (
        <div className="divide-y divide-zinc-800">
          {[0, 1, 2].map((i) => (
            <div key={i} className="py-4">
              <div className="h-5 animate-pulse rounded bg-zinc-800/60" />
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="py-6 text-center text-zinc-400">
          Couldn't load the chats.{" "}
          <button onClick={retry} className="underline hover:text-zinc-100">
            Retry
          </button>
        </p>
      )}

      {status === "ready" && chats.length === 0 && (
        <p className="py-6 text-center text-zinc-500">
          No chats yet. Ask something above to start one.
        </p>
      )}

      {status === "ready" && chats.length > 0 && (
        <ul className="divide-y divide-zinc-800">
          {chats.map((c) => (
            <li key={c.id}>
              <MenuRow
                onOpen={(rect) => setMenu({ chat: c, rect })}
                label={`Options for ${c.title}`}
              >
                <Link
                  to={`/chat/${c.id}`}
                  className="flex items-center justify-between gap-4 py-4 text-zinc-200 transition-colors hover:text-white [@media(hover:hover)]:pr-10"
                >
                  <span className="truncate">{c.title}</span>
                  <span className="shrink-0 text-sm text-zinc-500">{c.date}</span>
                </Link>
              </MenuRow>
            </li>
          ))}
        </ul>
      )}

      {menu && (
        <ChatActions
          chat={menu.chat}
          rect={menu.rect}
          rough={roughName}
          roughId={rbId}
          onClose={() => setMenu(null)}
          onChanged={reload}
        />
      )}
    </section>
  );
}