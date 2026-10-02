import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChatInput from "../../components/chat/ChatInput";
import MessageList from "../../components/chat/MessageList";
import NotFound from "../NotFound";
import useChat from "./hooks/useChat";
import { useHistory } from "../../components/sidebar/history-context";

const ERROR_TEXT = {
  signed_out: "Your session has expired. Use Sign out (top right), then sign in again.",
  network: "Can't reach the server. Check your connection and retry.",
  rate_limited: "Too many requests. Wait a moment and retry.",
  timeout: "This took too long. Please retry.",
};

function ChatScreen({ chatId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { refresh } = useHistory();

  // the message /new handed over (read once, when this screen is created)
  const [firstMessage] = useState(() => location.state?.firstMessage ?? null);

  // clear it from the router state so a refresh can't send it again
  useEffect(() => {
    if (location.state?.firstMessage) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    status,
    errorKind,
    messages,
    retry,
    send,
    isSending,
    sendError,
    retrySend,
  } = useChat(chatId, firstMessage, refresh);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        Loading chat...
      </div>
    );
  }

  if (status === "error") {
    if (errorKind === "not_found") return <NotFound />;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-zinc-300">
          {ERROR_TEXT[errorKind] ?? "Something went wrong."}
        </p>
        <button
          onClick={retry}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm transition-colors hover:bg-zinc-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList messages={messages} isLoading={isSending} />

      <div className="px-4 pb-4">
        <div className="mx-auto w-full max-w-2xl">
          {sendError && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              <span>{ERROR_TEXT[sendError] ?? "Couldn't get a reply."}</span>
              <button
                onClick={retrySend}
                className="shrink-0 rounded-md border border-red-800 px-3 py-1 transition-colors hover:bg-red-900/40"
              >
                Retry
              </button>
            </div>
          )}
          <ChatInput onSend={send} disabled={isSending} />
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { chatId } = useParams();
  return <ChatScreen key={chatId} chatId={chatId} />;
}