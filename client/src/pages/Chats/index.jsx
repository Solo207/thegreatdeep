import { Link } from "react-router-dom";
import useAllChats from "./hooks/useAllChats";

export default function Chats() {
  const { status, chats, retry } = useAllChats();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 pb-10">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-semibold">Chats</h1>
          <Link
            to="/new"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            New chat
          </Link>
        </div>

        {status === "loading" && (
          <div className="divide-y divide-zinc-800">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="py-4">
                <div className="h-5 animate-pulse rounded bg-zinc-800/60" />
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="py-8 text-center text-zinc-400">
            Couldn't load your chats.{" "}
            <button onClick={retry} className="underline hover:text-zinc-100">
              Retry
            </button>
          </p>
        )}

        {status === "ready" && chats.length === 0 && (
          <p className="py-8 text-center text-zinc-500">No chats yet</p>
        )}

        {status === "ready" && chats.length > 0 && (
          <ul className="divide-y divide-zinc-800">
            {chats.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/chat/${c.id}`}
                  className="flex items-center justify-between gap-4 py-4 text-zinc-200 transition-colors hover:text-white"
                >
                  <span className="truncate">{c.title}</span>
                  <span className="shrink-0 text-sm text-zinc-500">{c.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}