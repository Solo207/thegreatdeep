import { Link } from "react-router-dom";

export default function ChatListItem({ to, title, active = false, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-zinc-800 text-zinc-50"
          : "text-zinc-300 hover:bg-zinc-800/60"
      }`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full border transition-colors ${
          active
            ? "border-indigo-400 bg-indigo-400"
            : "border-zinc-600 group-hover:border-zinc-300"
        }`}
      />
      <span className="truncate">{title}</span>
    </Link>
  );
}