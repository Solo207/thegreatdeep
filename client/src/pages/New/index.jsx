import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import { createChat } from "../../lib/api/chats";
import useMediaQuery from "../../hooks/useMediaQuery";
import ChatInput from "../../components/chat/ChatInput";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";

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
  const [typing, setTyping] = useState(false);
  const isTouch = useMediaQuery("(pointer: coarse)");

  const firstName = data?.user.name?.split(" ")[0];

  // On a phone with the keyboard up: the box goes right above the keyboard and the
  // greeting is centred in the space left above it. Otherwise (computer, or keyboard
  // closed) the greeting and the box float together in the middle of the screen.
  const dock = typing && isTouch;

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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
      <div
        className={`mx-auto flex w-full ${CHAT_MAX_WIDTH} flex-col items-center py-2 ${
          dock ? "flex-1" : "my-auto"
        }`}
      >
        {/* in dock mode this area stretches, and the greeting sits in its middle */}
        <div className={dock ? "flex flex-1 items-center justify-center" : ""}>
          <h1
            className={`text-center text-3xl font-bold leading-tight ${
              dock ? "" : "mb-8"
            }`}
          >
            Hi {firstName}, what are we studying?
          </h1>
        </div>

        <div className="w-full">
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
          <ChatInput
            onSend={start}
            disabled={isStarting}
            autoFocus
            onFocusChange={setTyping}
          />
        </div>
      </div>
    </div>
  );
}