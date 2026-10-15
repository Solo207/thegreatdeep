import { useEffect, useRef, useState } from "react";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";
import { getPapers, startPaper } from "../../lib/api/pq";
import TimerModal from "./TimerModal";
import LinkDialog from "./LinkDialog";
import ConfirmDialog from "./ConfirmDialog";

// A fake page that slides in for one subject.
// The class groups (0'25, 0'26...) each get a heading and a horizontal row of sets.
// Used by Past questions (defaults) and by Bookmarks (its own functions + delete).
export default function PapersPanel({
  subject,
  closing,
  onBack,
  loadGroups = getPapers,
  startSet = startPaper,
  onDelete = null, // when given, every set gets a delete icon
  onEmpty = null, // called when the last set of the subject was deleted
  resultHeading = "Your past question",
}) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [groups, setGroups] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const [picked, setPicked] = useState(null); // the set that was tapped
  const [result, setResult] = useState(null); // null | { state: "loading" | "ready" | "error", link }
  const [deleting, setDeleting] = useState(null); // the set waiting for confirmation
  const [deleteState, setDeleteState] = useState("idle"); // idle | busy | error
  const run = useRef(0);

  // a subject was tapped: ask for its sets
  useEffect(() => {
    let ignore = false;
    loadGroups(subject)
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
  }, [subject, attempt, loadGroups]);

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
      const link = await startSet({ code: item.code, title: item.title, time });
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

  const askDelete = (item) => {
    setDeleteState("idle");
    setDeleting(item);
  };

  const cancelDelete = () => {
    setDeleting(null);
    setDeleteState("idle");
  };

  // the delete was confirmed
  const confirmDelete = async () => {
    const item = deleting;
    setDeleteState("busy");
    try {
      await onDelete(item);
      const next = groups
        .map((g) => ({ ...g, items: g.items.filter((it) => it !== item) }))
        .filter((g) => g.items.length > 0);
      setGroups(next);
      setDeleting(null);
      setDeleteState("idle");
      if (next.length === 0) onEmpty?.(subject);
    } catch {
      setDeleteState("error");
    }
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
            aria-label="Back"
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
          <p className="py-8 text-center text-zinc-500">
            {onDelete ? "No bookmarks here" : "No past questions here yet"}
          </p>
        )}

        {status === "ready" &&
          groups.map((group) => (
            <section key={group.name} className="mb-8">
              <h2 className="mb-3 flex items-center gap-3">
                <span className="rounded-md bg-indigo-500/20 px-2.5 py-1 text-lg font-bold text-indigo-200">
                  {group.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {group.items.length} {group.items.length === 1 ? "paper" : "papers"}
                </span>
              </h2>

              {/* a horizontal row of sets; the code is never shown */}
              <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                {group.items.map((item, i) => (
                  <div
                    key={`${item.code}-${i}`}
                    className="relative w-64 shrink-0 snap-start rounded-xl border border-zinc-700 bg-zinc-800/50 transition-colors hover:border-indigo-400/60 hover:bg-zinc-800"
                  >
                    <button
                      onClick={() => setPicked(item)}
                      className={`block w-full cursor-pointer rounded-xl p-4 text-left ${
                        onDelete ? "pr-12" : ""
                      }`}
                    >
                      <p className="font-bold">{item.title}</p>
                      {item.description && (
                        <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
                      )}
                    </button>

                    {onDelete && (
                      <button
                        onClick={() => askDelete(item)}
                        aria-label={`Delete ${item.title}`}
                        title="Delete"
                        className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/15 hover:text-red-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                        </svg>
                      </button>
                    )}
                  </div>
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
          heading={resultHeading}
          message="You'll soon be redirected. Or tap this link to see your question."
          link={result.link}
          onClose={closeResult}
        />
      )}

      {deleting && (
        <ConfirmDialog
          heading="Remove this bookmark?"
          message={[deleting.title, deleting.description].filter(Boolean).join(". ")}
          busy={deleteState === "busy"}
          error={deleteState === "error" ? "Couldn't delete it. Please try again." : null}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}