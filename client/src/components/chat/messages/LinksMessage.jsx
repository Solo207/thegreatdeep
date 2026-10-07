// Small boxes that open a web page in a new tab. Always active.
export default function LinksMessage({ message, body }) {
  const links = message.content.links ?? [];

  return (
    <div>
      {body}
      <div className="mt-2 flex flex-wrap gap-2">
        {links.map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 transition-colors hover:border-indigo-400 hover:bg-zinc-800"
          >
            <span className="truncate">{l.label}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0 text-zinc-400"
            >
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}