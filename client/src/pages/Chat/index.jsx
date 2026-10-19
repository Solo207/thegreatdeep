import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChatInput from "../../components/chat/ChatInput";
import MessageList from "../../components/chat/MessageList";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";
import { useHistory } from "../../components/sidebar/history-context";
import NotFound from "../NotFound";
import ChatHeader from "./ChatHeader";
import useChat from "./hooks/useChat";
import { useRoughbooks } from "../../components/roughbooks/roughbooks-context";

const ERROR_TEXT = {
  signed_out: "Your session has expired. Use Sign out (top right), then sign in again.",
  network: "Can't reach the server. Check your connection and retry.",
  rate_limited: "Too many requests. Wait a moment and retry.",
  timeout: "This took too long. Please retry.",
};

function ChatScreen({ chatId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { refresh, chats, pinned } = useHistory();
  const roughbooks = useRoughbooks();

  // what /new (or a roughbook) handed over, read once when this screen is created
  const [firstMessage] = useState(() => location.state?.firstMessage ?? null);
  const [roughFromNav] = useState(() => location.state?.rough ?? "");

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
    meta,
    retry,
    send,
    isWaiting,
    inputLocked,
    words,
    sendError,
    retrySend,
  } = useChat(chatId, firstMessage, refresh);

  // The chat can sit in the normal list or in the pinned list (pinned chats may leave the
  // normal one), so both are checked. The roughbook name is also found by its id.
  const listed = [...pinned, ...chats].filter((c) => c.id === chatId);
  const listedRoughId = listed.find((c) => c.roughId)?.roughId || "";
  const { ensureLoaded } = roughbooks;
  useEffect(() => {
    if (listedRoughId) ensureLoaded();
  }, [listedRoughId, ensureLoaded]);

  const title = listed.find((c) => c.title)?.title || meta?.title || "New chat";
  const rough =
    listed.find((c) => c.rough)?.rough ||
    roughbooks.books.find((b) => b.id === listedRoughId)?.title ||
    meta?.rough ||
    roughFromNav ||
    "";

  // what the header's 3-dots menu works on
  const chatForMenu = {
    id: chatId,
    title,
    rough,
    roughId: listedRoughId,
    pin: pinned.some((p) => p.id === chatId),
  };

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
      <ChatHeader chat={chatForMenu} />
      <MessageList messages={messages} isLoading={isWaiting} words={words} onSelect={send} />

      <div className="px-4 pb-4">
        <div className={`mx-auto w-full ${CHAT_MAX_WIDTH}`}>
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
          <ChatInput onSend={send} disabled={inputLocked} compact />
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { chatId } = useParams();
  return <ChatScreen key={chatId} chatId={chatId} />;
}