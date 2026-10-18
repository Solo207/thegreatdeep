import { useState } from "react";
import { Link } from "react-router-dom";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";
import { useHistory } from "../../components/sidebar/history-context";
import { deleteChats } from "../../lib/api/chatActions";
import { warmUpKeyboard } from "../../lib/keyboard";
import ConfirmDialog from "../PastQuestions/ConfirmDialog";
import useAllChats from "./hooks/useAllChats";

const buttonStyle =
  "cursor-pointer rounded-lg border border-zinc-700 px-3.5 py-2 text-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50";

export default function Chats() {
  const { status, chats, setChats, retry } = useAllChats();
  const { refresh } = useHistory();
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [confirming, setConfirming] = useState(false);
  const [deleteState, setDeleteState] = useState("idle"); // idle | busy | error

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allPicked = chats.length > 0 && picked.size === chats.length;
  const selectAll = () => setPicked(allPicked ? new Set() : new Set(chats.map((c) => c.id)));

  const stopSelecting = () => {
    setSelecting(false);
    setPicked(new Set());
  };

  // all the picked chats go to n8n together, as one array
  const confirmDelete = async () => {
    setDeleteState("busy");
    try {
      await deleteChats([...picked]);
      setChats((prev) => prev.filter((c) => !picked.has(c.id)));
      setConfirming(false);
      setDeleteState("idle");
      stopSelecting();
      refresh(); // the sidebar's list too
    } catch {
      setDeleteState("error");
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={`mx-auto w-full ${CHAT_MAX_WIDTH} px-4 pb-10`}>
        <div className="flex items-center justify-between gap-3 py-6">
          <h1 className="text-2xl font-bold">
            {selecting ? `${picked.size} selected` : "Chats"}
          </h1>

          <div className="flex items-center gap-2">
            {selecting ? (
              <>
                <button onClick={selectAll} className={buttonStyle}>
                  {allPicked ? "Clear" : "Select all"}
                </button>
                <button onClick={stopSelecting} className={buttonStyle}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setDeleteState("idle");
                    setConfirming(true);
                  }}
                  disabled={picked.size === 0}
                  className="cursor-pointer rounded-lg bg-red-500 px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelecting(true)}
                  disabled={status !== "ready" || chats.length === 0}
                  className={buttonStyle}
                >
                  Select
                </button>
                <Link
                  to="/new"
                  onClick={warmUpKeyboard}
                  className="rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
                >
                  New
                </Link>
              </>
            )}
          </div>
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
                {selecting ? (
                  <button
                    onClick={() => toggle(c.id)}
                    className="flex w-full cursor-pointer items-center gap-3 py-4 text-left text-zinc-200 transition-colors hover:text-white"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        picked.has(c.id)
                          ? "border-indigo-400 bg-indigo-500"
                          : "border-zinc-600"
                      }`}
                    >
                      {picked.has(c.id) && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5"
                        >
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                    <span className="shrink-0 text-sm text-zinc-500">{c.date}</span>
                  </button>
                ) : (
                  <Link
                    to={`/chat/${c.id}`}
                    className="flex items-center justify-between gap-4 py-4 text-zinc-200 transition-colors hover:text-white"
                  >
                    <span className="truncate">{c.title}</span>
                    <span className="shrink-0 text-sm text-zinc-500">{c.date}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          heading={`Delete ${picked.size} ${picked.size === 1 ? "chat" : "chats"}?`}
          message="They will be deleted for good."
          busy={deleteState === "busy"}
          error={deleteState === "error" ? "Couldn't delete them. Please try again." : null}
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}