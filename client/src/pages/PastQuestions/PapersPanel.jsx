import { useEffect, useRef, useState } from "react";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";
import { getPapers, startPaper } from "../../lib/api/pq";
import TimerModal from "./TimerModal";
import LinkDialog from "./LinkDialog";

// A fake page that slides in over /past_questions for one subject.
// The class groups (0'25, 0'26...) each get a heading and a horizontal row of sets.
export default function PapersPanel({ subject, closing, onBack }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [groups, setGroups] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const [picked, setPicked] = useState(null); // the set that was tapped
  const [result, setResult] = useState(null); // null | { state: "loading" | "ready" | "error", link }
  const run = useRef(0);

  // a subject was tapped: ask for its sets
  useEffect(() => {
    let ignore = false;
    getPapers(subject)
      .then((g) => {
        if (ignore) return;
        setGroups(g);
        setStatus("ready");
      })
      .catch(() => {
        if (ignore) return;
        setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, [subject, attempt]);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  // the timer question was answered: ask for the link
  const begin = async (time) => {
    const item = picked;
    const id = ++run.current;
    setPicked(null);
    setResult({ state: "loading" });
    try {
      const link = await startPaper({ code: item.code, title: item.title, time });
      if (id !== run.current) return; // closed meanwhile
      setResult({ state: "ready", link });
    } catch {
      if (id !== run.current) return;
      setResult({ state: "error" });
    }
  };

  const closeResult = () => {
    run.current++;
    setResult(null);
  };

  return (
    <div
      style={{
        animation: closing
          ? "slide-out-right 220ms ease-in forwards"
          : "slide-in-right 250ms ease-out",
      }}
      className="absolute inset-0 z-10 overflow-y-auto bg-zinc-900"
    >
      <div className={`mx-auto w-full ${CHAT_MAX_WIDTH} px-4 pb-10`}>
        <div className="flex items-center gap-3 py-6">
          <button
            onClick={onBack}
            aria-label="Back to past questions"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <h1 className="min-w-0 truncate text-2xl font-bold">{subject}</h1>
        </div>

        {status === "loading" && (
          <div className="flex flex-col gap-8">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i}>
                <div className="mb-3 h-7 w-24 animate-pulse rounded-md bg-zinc-800/60" />
                <div className="flex gap-3">
                  <div className="h-24 w-64 shrink-0 animate-pulse rounded-xl bg-zinc-800/60" />
                  <div className="h-24 w-64 shrink-0 animate-pulse rounded-xl bg-zinc-800/60" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="py-8 text-center text-zinc-400">
            Couldn't load this subject.{" "}
            <button onClick={retry} className="underline hover:text-zinc-100">
              Retry
            </button>
          </p>
        )}

        {status === "ready" && groups.length === 0 && (
          <p className="py-8 text-center text-zinc-500">No past questions here yet</p>
        )}

        {status === "ready" &&
          groups.map((group) => (
            <section key={group.name} className="mb-8">
              <h2 className="mb-3 flex items-center gap-3">
                <span className="rounded-md bg-indigo-500/20 px-2.5 py-1 text-lg font-bold text-indigo-200">
                  {group.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {group.items.length} {group.items.length === 1 ? "set" : "sets"}
                </span>
              </h2>

              {/* a horizontal row of sets; the code is never shown */}
              <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                {group.items.map((item, i) => (
                  <button
                    key={`${item.code}-${i}`}
                    onClick={() => setPicked(item)}
                    className="w-64 shrink-0 cursor-pointer snap-start rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-left transition-colors hover:border-indigo-400/60 hover:bg-zinc-800"
                  >
                    <p className="font-bold">{item.title}</p>
                    {item.description && (
                      <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
      </div>

      {picked && (
        <TimerModal item={picked} onSubmit={begin} onClose={() => setPicked(null)} />
      )}

      {result && (
        <LinkDialog
          state={result.state}
          heading="Your past question"
          message="You'll soon be redirected. Or tap this link to see your question."
          link={result.link}
          onClose={closeResult}
        />
      )}
    </div>
  );
}