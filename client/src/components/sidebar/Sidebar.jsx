import { Link, useMatch, useNavigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import SidebarToggle from "./SidebarToggle";
import ChatListItem from "./ChatListItem";
import { useHistory } from "./history-context";
import ResizeHandle from "./ResizeHandle";
import { SIDEBAR_DEFAULT_WIDTH } from "./config";
import { requestChatFocus, warmUpKeyboard } from "../../lib/keyboard";

export default function Sidebar({
  width = SIDEBAR_DEFAULT_WIDTH,
  maxWidth = "85vw",
  onResize,
  onToggle,
  onNavigate,
}) {
  const navigate = useNavigate();
  const { chats, hasMore, status, retry } = useHistory();
  const activeId = useMatch("/chat/:chatId")?.params.chatId;

  return (
    <aside
      style={{ width, maxWidth }}
      className="relative flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-950"
    >      {/* pinned top */}
      <div className="shrink-0 p-3">
        <div className="mb-3 flex items-center gap-2">
          <SidebarToggle onClick={onToggle} />
          <span className="text-lg font-semibold">Solo</span>
        </div>
        <Link
          to="/new"
          onClick={() => {
            warmUpKeyboard();
            requestChatFocus();
            onNavigate?.();
          }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </Link>
      </div>

      {/* scrolling middle */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <p className="px-3 pb-1 pt-2 text-xs text-zinc-500">Chats</p>

        {status === "loading" &&
          Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="mx-1 my-1.5 h-7 animate-pulse rounded-lg bg-zinc-800/60"
            />
          ))}

        {status === "error" && (
          <p className="px-3 py-2 text-sm text-zinc-400">
            Couldn't load chats.{" "}
            <button onClick={retry} className="underline hover:text-zinc-100">
              Retry
            </button>
          </p>
        )}

        {status === "ready" && chats.length === 0 && (
          <p className="px-3 py-2 text-sm text-zinc-500">No chats yet</p>
        )}

        {status === "ready" &&
          chats.map((c) => (
            <ChatListItem
              key={c.id}
              to={`/chat/${c.id}`}
              title={c.title}
              active={c.id === activeId}
              onClick={onNavigate}
            />
          ))}

        {status === "ready" && hasMore && (
          <Link
            to="/chats"
            onClick={onNavigate}
            className="mt-1 block rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            View all
          </Link>
        )}
      </nav>

      {/* pinned bottom */}
      <div className="shrink-0 border-t border-zinc-800 p-3">
        <button
          onClick={() =>
            authClient.signOut({
              fetchOptions: { onSuccess: () => navigate("/login") },
            })
          }
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>
      {onResize && <ResizeHandle width={width} onResize={onResize} />}
    </aside>
  );
}