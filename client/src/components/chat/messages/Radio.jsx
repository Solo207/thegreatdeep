export default function Radio({ selected }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        selected ? "border-indigo-400" : "border-zinc-600"
      }`}
    >
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />}
    </span>
  );
}