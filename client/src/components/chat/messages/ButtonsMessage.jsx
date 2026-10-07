// Quick-reply buttons. Tappable only while this is the newest message.
// Once one is tapped it is sent, highlighted, and the others are disabled.
export default function ButtonsMessage({ message, body, active, chosenText, onSelect }) {
  const buttons = message.content.buttons ?? [];
  // the tapped button is the one whose label the user sent next
  const chosenIndex = chosenText ? buttons.findIndex((b) => b.label === chosenText) : -1;

  return (
    <div>
      {body}
        <div className="mt-2 flex flex-col items-start gap-2">
        {buttons.map((b, i) => {
          const chosen = i === chosenIndex;
          const style = chosen
            ? "border-indigo-500 bg-indigo-500 text-white"
            : active
            ? "cursor-pointer border-indigo-400/60 text-indigo-200 hover:bg-indigo-500/15"
            : "cursor-not-allowed border-zinc-700 text-zinc-500 opacity-60";

          return (
            <button
              key={b.id}
              disabled={!active}
              onClick={() =>
                onSelect(b.label, { id: b.id, source: "buttons", messageId: message.id })
              }
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${style}`}
            >
              {chosen && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5" 
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
              {b.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}