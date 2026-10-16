import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ChatInput from "../../components/chat/ChatInput";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";
import { useRoughbooks } from "../../components/roughbooks/roughbooks-context";
import { createChat } from "../../lib/api/chats";
import RoughbookHistory from "./RoughbookHistory";

const ERROR_TEXT = {
  signed_out: "Your session has expired. Use Sign out, then sign in again.",
  network: "Can't reach the server. Check your connection and retry.",
  rate_limited: "Too many requests. Wait a moment and retry.",
  timeout: "This took too long. Please retry.",
};

export default function Roughbook() {
  const { rbId } = useParams();
  const navigate = useNavigate();
  const { books, ensureLoaded } = useRoughbooks();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null); // { kind, text }

  // the roughbook's name comes from the shared list
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);
  const name = books.find((b) => b.id === rbId)?.title ?? "Roughbook";

  // A message was sent: create a chat inside this roughbook (chat-create gets rb),
  // then open it. The chat page sends the message, as it does from /new.
  async function start(text) {
    if (isStarting) return;
    setIsStarting(true);
    setError(null);
    try {
      const id = await createChat({ rb: rbId });
      navigate(`/chat/${id}`, { state: { firstMessage: text, rough: name } });
    } catch (err) {
      setError({ kind: err.kind ?? "failed", text });
      setIsStarting(false);
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={`mx-auto w-full ${CHAT_MAX_WIDTH} px-4 pb-10`}>
        <div className="py-6">
          <p className="text-sm text-zinc-500">
            <Link to="/roughbook" className="transition-colors hover:text-zinc-200">
              Rough books
            </Link>
          </p>
          <h1 className="mt-1 truncate text-2xl font-bold">{name}</h1>
        </div>

        {error && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            <span>{ERROR_TEXT[error.kind] ?? "Couldn't start the chat."}</span>
            <button
              onClick={() => start(error.text)}
              className="shrink-0 rounded-md border border-red-800 px-3 py-1 transition-colors hover:bg-red-900/40"
            >
              Retry
            </button>
          </div>
        )}
        <ChatInput onSend={start} disabled={isStarting} />

        {/* key: switching roughbooks starts the history fresh */}
        <RoughbookHistory key={rbId} rbId={rbId} />
      </div>
    </div>
  );
}