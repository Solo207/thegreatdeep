import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import { createChat } from "../../lib/api/chats";
import ChatInput from "../../components/chat/ChatInput";

const ERROR_TEXT = {
  signed_out: "Your session has expired. Use Sign out (top right), then sign in again.",
  network: "Can't reach the server. Check your connection and retry.",
  rate_limited: "Too many requests. Wait a moment and retry.",
  timeout: "This took too long. Please retry.",
};

export default function New() {
  const { data } = authClient.useSession();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null); // { kind, text }

  const firstName = data?.user.name?.split(" ")[0];

  async function start(text) {
    if (isStarting) return;
    setIsStarting(true);
    setError(null);
    try {
      const id = await createChat();
      // hand the first message to the Chat page through the router state
      navigate(`/chat/${id}`, { state: { firstMessage: text } });
    } catch (err) {
      setError({ kind: err.kind ?? "failed", text });
      setIsStarting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
      <h1 className="mb-8 text-center text-3xl font-semibold [@media(max-height:500px)]:hidden">
        Hi {firstName}, what are we studying?
      </h1>

      <div className="w-full max-w-2xl">
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
      </div>
    </div>
  );
}