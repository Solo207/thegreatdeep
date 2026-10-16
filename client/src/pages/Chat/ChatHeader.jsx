import { CHAT_MAX_WIDTH } from "../../components/chat/config";

// Top bar of a chat: "roughbook name / chat title", or just the title.
export default function ChatHeader({ title, rough }) {
  return (
    <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
      <div className={`mx-auto flex w-full items-center gap-2 text-sm ${CHAT_MAX_WIDTH}`}>
        {rough && (
          <>
            <span className="max-w-[40%] shrink-0 truncate text-zinc-400" title={rough}>
              {rough}
            </span>
            <span className="text-zinc-600">/</span>
          </>
        )}
        <span className="min-w-0 flex-1 truncate font-bold" title={title}>
          {title}
        </span>
      </div>
    </div>
  );
}