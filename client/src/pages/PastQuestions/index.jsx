import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CHAT_MAX_WIDTH } from "../../components/chat/config";
import { addPastQuestion, getSubjects } from "../../lib/api/pq";
import PapersPanel from "./PapersPanel";
import LinkDialog from "./LinkDialog";
import usePageTitle from "../../hooks/usePageTitle";

export default function PastQuestions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const subject = searchParams.get("subject"); // the slide-in page is open while this is set
  usePageTitle(subject || "Past questions");
  const pushed = useRef(false);
  const [closing, setClosing] = useState(false);

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [subjects, setSubjects] = useState([]);
  const [attempt, setAttempt] = useState(0);

  const [add, setAdd] = useState(null); // null | { state: "loading" | "ready" | "error", link }
  const addRun = useRef(0);

  // the page loads: ask for the subjects
  useEffect(() => {
    let ignore = false;
    getSubjects()
      .then((list) => {
        if (ignore) return;
        setSubjects(list);
        setStatus("ready");
      })
      .catch(() => {
        if (ignore) return;
        setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  const openSubject = (name) => {
    pushed.current = true;
    setSearchParams({ subject: name });
  };

  // slide out, then go back (the phone's back button closes it too)
  const closeSubject = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      if (pushed.current) {
        pushed.current = false;
        navigate(-1);
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 220);
  };

  const addPq = async () => {
    const run = ++addRun.current;
    setAdd({ state: "loading" });
    try {
      const link = await addPastQuestion();
      if (run !== addRun.current) return; // closed meanwhile
      setAdd({ state: "ready", link });
    } catch {
      if (run !== addRun.current) return;
      setAdd({ state: "error" });
    }
  };

  const closeAdd = () => {
    addRun.current++;
    setAdd(null);
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className={`mx-auto w-full ${CHAT_MAX_WIDTH} px-4 pb-10`}>
          <div className="py-6">
            <h1 className="text-2xl font-bold">Past questions</h1>
          </div>

          <button
            onClick={addPq}
            className="mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add past question
          </button>

          {status === "loading" && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-800/60" />
              ))}
            </div>
          )}

          {status === "error" && (
            <p className="py-8 text-center text-zinc-400">
              Couldn't load the subjects.{" "}
              <button onClick={retry} className="underline hover:text-zinc-100">
                Retry
              </button>
            </p>
          )}

          {status === "ready" && subjects.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Nothing here yet</p>
          )}

          {status === "ready" && subjects.length > 0 && (
            <ul className="flex flex-col gap-2">
              {subjects.map((name, i) => (
                <li key={`${name}-${i}`}>
                  <button
                    onClick={() => openSubject(name)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-700 px-4 py-3.5 text-left transition-colors hover:border-indigo-400/60 hover:bg-zinc-800"
                  >
                    <span className="min-w-0 truncate">{name}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0 text-zinc-500"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* the slide-in "page" for the tapped subject */}
      {subject && (
        <PapersPanel
          key={subject}
          subject={subject}
          closing={closing}
          onBack={closeSubject}
        />
      )}

      {add && (
        <LinkDialog
          state={add.state}
          heading="Add past question"
          message="Click the link below."
          link={add.link}
          onClose={closeAdd}
        />
      )}
    </div>
  );
}