// One row of a small floating menu: an icon and a label.
export default function MenuItem({
  iconNode,
  children,
  onClick,
  danger = false,
  right = null,
  selected = false,
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
        danger ? "text-red-300 hover:bg-red-500/15" : "hover:bg-zinc-800"
      } ${selected ? "bg-zinc-800/60" : ""}`}
    >
      {iconNode}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {right}
    </button>
  );
}