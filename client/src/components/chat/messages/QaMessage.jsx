import { useState } from "react";
import Markdown from "../Markdown";
import QaModal from "./QaModal";
import { matchAnswers, summarize, toSelection } from "./qa-utils";

// Questions are asked in a pop-up, and they also sit in the chat:
//  - unanswered: the question text, with an "Options" bar below it that opens the pop-up
//      (answerable while this is the newest message, read-only after you moved on)
//  - answered: each question with the answer that was picked or typed
export default function QaMessage({ message, active, nextUserText, onSelect }) {
  const { body, questions } = message.content;
  const [dismissed, setDismissed] = useState(false); // closed while it could still be answered
  const [viewing, setViewing] = useState(false);     // opened for reading after moving on
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  // answered = the user's next message answers every question
  const given = nextUserText !== null ? matchAnswers(questions, nextUserText) : null;

  const open = !given && (active ? !dismissed : viewing);

  const setAnswer = (questionId, patch) =>
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));

  const submit = () => {
    onSelect(summarize(questions, answers), toSelection(message.id, questions, answers));
  };

  const close = () => (active ? setDismissed(true) : setViewing(false));

  // open the pop-up at question number i
  const openAt = (i) => {
    setStep(i);
    if (active) setDismissed(false);
    else setViewing(true);
  };

  return (
    <div>
      {body && <Markdown>{body}</Markdown>}

      {/* answered: each question with the answer that was picked or typed */}
      {given && (
        <div className={`flex max-w-md flex-col gap-4 ${body ? "mt-3" : ""}`}>
          {given.map(({ question, text }) => (
            <div key={question.id}>
              <p className="whitespace-pre-wrap text-sm text-zinc-400">{question.text}</p>
              <p className="mt-1.5 inline-flex max-w-full items-center gap-2 rounded-xl border border-indigo-500 bg-indigo-500/15 px-3 py-1.5 text-sm text-indigo-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 shrink-0"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
                <span className="break-words">{text}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* unanswered: the question text with an Options bar below it */}
      {!given && (
        <div className={`flex flex-col gap-4 ${body ? "mt-3" : ""}`}>
          {questions.map((q, i) => (
            <div key={q.id} className="max-w-md">
              <p className="whitespace-pre-wrap leading-relaxed">
                {questions.length > 1 ? `${i + 1}. ` : ""}
                {q.text}
              </p>
              <button
                onClick={() => openAt(i)}
                className={`mt-2 flex w-full max-w-xs cursor-pointer items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "border-indigo-400/60 text-indigo-200 hover:bg-indigo-500/15"
                    : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <span>Options</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 shrink-0"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          ))}
          {!active && <p className="text-xs text-zinc-500">Not answered</p>}
        </div>
      )}

      {open && (
        <QaModal
          questions={questions}
          step={step}
          answers={answers}
          readOnly={!active}
          onAnswer={setAnswer}
          onBack={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(questions.length - 1, s + 1))}
          onSubmit={submit}
          onClose={close}
        />
      )}
    </div>
  );
}