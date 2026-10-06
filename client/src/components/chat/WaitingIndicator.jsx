import { useEffect, useState } from "react";

const WORD_MS = 2000; // how long each word stays on screen
const LOOP = true;    // true: start again after the last word. false: stay on the last word.

// The bouncing dots, plus the status words from n8n (e.g. Mulling, Processing),
// shown one after another while the reply is being prepared.
export default function WaitingIndicator({ words = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1 < words.length ? i + 1 : LOOP ? 0 : i));
    }, WORD_MS);
    return () => clearInterval(timer);
  }, [words]);

  const word = words.length > 0 ? words[index % words.length] : null;

  return (
    <div className="flex items-center gap-2 px-1 py-3 text-sm text-zinc-400">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
      </span>
      {word && (
        <span key={index} style={{ animation: "word-in 300ms ease-out" }}>
          {word}…
        </span>
      )}
    </div>
  );
}