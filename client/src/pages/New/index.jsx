import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import { createChat } from "../../lib/api/chats";
import ChatInput from "../../components/chat/ChatInput";
import useVisualViewportHeight from "../../hooks/useVisualViewportHeight";

const ERROR_TEXT = {
  signed_out: "Your session has expired. Use Sign out (top right), then sign in again.",
  network: "Can't reach the server. Check your connection and retry.",
  rate_limited: "Too many requests. Wait a moment and retry.",
  timeout: "This took too long. Please retry.",
};

const clamp = (min, value, max) => Math.min(max, Math.max(min, value));

export default function New() {
  const { data } = authClient.useSession();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null); // { kind, text }
  const viewportHeight = useVisualViewportHeight();

  const firstName = data?.user.name?.split(" ")[0];

  // The greeting and the space under it shrink with the visible height:
  // full size on a tall screen, smaller when the phone keyboard takes half of it.
  const titleSize = clamp(18, viewportHeight * 0.045, 30); // px
  const titleGap = clamp(8, viewportHeight * 0.04, 32);    // px

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
      {/* m-auto centres this block, and lets it scroll instead of being cut off
          if the screen is ever shorter than its content */}
      <div className="m-auto flex w-full max-w-2xl flex-col items-center py-2">
        <h1
          style={{ fontSize: titleSize, marginBottom: titleGap }}
          className="text-center font-semibold leading-tight"
        >
          Hi {firstName}, what are we studying?
        </h1>

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
          <ChatInput onSend={start} disabled={isStarting} autoFocus />
        </div>
      </div>
    </div>
  );
}