import { Link, useMatch, useNavigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import { requestChatFocus, warmUpKeyboard } from "../../lib/keyboard";
import SidebarToggle from "./SidebarToggle";
import ChatListItem from "./ChatListItem";
import RoughbookMenu from "./RoughbookMenu";
import ResizeHandle from "./ResizeHandle";
import useCollapsed from "./useCollapsed";
import { useHistory } from "./history-context";
import { SIDEBAR_DEFAULT_WIDTH } from "./config";

// the little chevron of a foldable section: down when folded, up when open
function Chevron({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-4 w-4",
};

const navLink =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-800";

export default function Sidebar({
  width = SIDEBAR_DEFAULT_WIDTH,
  maxWidth = "85vw",
  onResize,
  onToggle,
  onNavigate,
}) {
  const navigate = useNavigate();
  const { chats, pinned, hasMore, status, retry } = useHistory();
  const activeId = useMatch("/chat/:chatId")?.params.chatId;
  const [pinnedCollapsed, togglePinned] = useCollapsed("sidebar-pinned-collapsed");
  const [chatsCollapsed, toggleChats] = useCollapsed("sidebar-chats-collapsed");

  return (
    <aside
      style={{ width, maxWidth }}
      className="relative flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-950"
    >
      {/* pinned top */}
      <div className="shrink-0 p-3">
        <div className="mb-3 flex items-center gap-2">
          <SidebarToggle onClick={onToggle} />
          <span className="text-lg font-bold">RoughBOOK</span>
        </div>

        <Link
          to="/new"
          onClick={() => {
            warmUpKeyboard();
            requestChatFocus();
            onNavigate?.();
          }}
          className={navLink}
        >
          <svg {...iconProps}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </Link>

        <Link to="/past_questions" onClick={onNavigate} className={`mt-1 ${navLink}`}>
          <svg {...iconProps}>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h6" />
          </svg>
          Past questions
        </Link>

        <Link to="/bookmarks" onClick={onNavigate} className={`mt-1 ${navLink}`}>
          <svg {...iconProps}>
            <path d="M6 4h12v17l-6-4-6 4z" />
          </svg>
          Bookmarks
        </Link>

        <RoughbookMenu onNavigate={onNavigate} />
      </div>

      {/* scrolling middle */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {/* Pinned: only when there is something pinned, and it can be folded away */}
        {pinned.length > 0 && (
          <>
            <button
              onClick={togglePinned}
              aria-expanded={!pinnedCollapsed}
              className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 pb-1 pt-2 text-xs text-zinc-500 transition-colors hover:text-zinc-100"
            >
              <span>Pinned</span>
              <Chevron open={!pinnedCollapsed} />
            </button>
            {!pinnedCollapsed &&
              pinned.map((c) => (
                <ChatListItem
                  key={`pin-${c.id}`}
                  chat={c}
                  active={c.id === activeId}
                  onNavigate={onNavigate}
                />
              ))}
          </>
        )}

        {/* Chats: the label opens /chats, the chevron folds the list away */}
        <div className="flex items-center justify-between">
          <Link
            to="/chats"
            onClick={onNavigate}
            title="All chats"
            className="group flex items-center gap-1 px-3 pb-1 pt-2 text-xs text-zinc-500 transition-colors hover:text-zinc-100"
          >
            Chats
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <button
            onClick={toggleChats}
            aria-label={chatsCollapsed ? "Show chats" : "Hide chats"}
            aria-expanded={!chatsCollapsed}
            className="mr-1 mt-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-zinc-100"
          >
            <Chevron open={!chatsCollapsed} />
          </button>
        </div>

        {!chatsCollapsed && (
          <>
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
                  chat={c}
                  active={c.id === activeId}
                  onNavigate={onNavigate}
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
          </>
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
          className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>

      {onResize && <ResizeHandle width={width} onResize={onResize} />}
    </aside>
  );
}