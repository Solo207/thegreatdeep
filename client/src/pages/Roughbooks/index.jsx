import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";
import { useRoughbooks } from "../../components/roughbooks/roughbooks-context";
import { createRoughbook } from "../../lib/api/rb";
import NewRoughbookDialog from "./NewRoughbookDialog";
import RoughbookActions from "../../components/roughbooks/RoughbookActions";
import MenuRow from "../../components/MenuRow";

function NewButton({ onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-400 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      New roughbook
    </button>
  );
}

export default function Roughbooks() {
  const { books, status, refresh, add } = useRoughbooks();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [menu, setMenu] = useState(null); // null | { book, rect }

  // the page opens: ask n8n (rb) for the roughbooks
  useEffect(() => {
    refresh();
  }, [refresh]);

  // the name was typed: create it, then open it
  const create = async (name) => {
    const id = await createRoughbook(name);
    add({ id, title: name, last_updated: "just now" });
    navigate(`/roughbook/${id}`);
  };

  const loading = status === "idle" || status === "loading";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={`mx-auto w-full ${CHAT_MAX_WIDTH} px-4 pb-10`}>
        <div className="py-6">
          <h1 className="text-2xl font-bold">Rough books</h1>
        </div>

        <NewButton onClick={() => setCreating(true)} className="mb-6 w-full" />

        {loading && (
          <div className="divide-y divide-zinc-800">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="py-4">
                <div className="h-5 animate-pulse rounded bg-zinc-800/60" />
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="py-8 text-center text-zinc-400">
            Couldn't load your roughbooks.{" "}
            <button onClick={refresh} className="underline hover:text-zinc-100">
              Retry
            </button>
          </p>
        )}

        {status === "ready" && books.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-zinc-500">You don't have any roughbooks yet.</p>
            <NewButton onClick={() => setCreating(true)} className="px-6" />
          </div>
        )}

        {status === "ready" && books.length > 0 && (
          <ul className="divide-y divide-zinc-800">
            {books.map((b) => (
              <li key={b.id}>
                <MenuRow
                  onOpen={(rect) => setMenu({ book: b, rect })}
                  label={`Options for ${b.title}`}
                >
                  <Link
                    to={`/roughbook/${b.id}`}
                    className="flex items-center justify-between gap-4 py-4 text-zinc-200 transition-colors hover:text-white [@media(hover:hover)]:pr-10"
                  >
                    <span className="truncate">{b.title}</span>
                    <span className="shrink-0 text-sm text-zinc-500">{b.last_updated}</span>
                  </Link>
                </MenuRow>
              </li>
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <NewRoughbookDialog onCreate={create} onClose={() => setCreating(false)} />
      )}

      {menu && (
        <RoughbookActions
          book={menu.book}
          rect={menu.rect}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}