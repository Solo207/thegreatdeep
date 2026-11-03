import { Link } from "react-router-dom";
import { requestChatFocus, warmUpKeyboard } from "../lib/keyboard";

export default function NewChatButton({ size = "h-9 w-9", onClick }) {
  return (
    <Link
      to="/new"
      aria-label="New chat"
      title="New chat"
      onClick={() => {
        warmUpKeyboard();
        requestChatFocus();
        onClick?.();
      }}
      className={`flex ${size} shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </Link>
  );
}