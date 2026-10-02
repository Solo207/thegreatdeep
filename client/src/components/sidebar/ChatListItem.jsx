import { Link } from "react-router-dom";

export default function ChatListItem({ to, title, active = false, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block w-full truncate rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-zinc-800 text-zinc-50"
          : "text-zinc-300 hover:bg-zinc-800/60"
      }`}
    >
      {title}
    </Link>
  );
}