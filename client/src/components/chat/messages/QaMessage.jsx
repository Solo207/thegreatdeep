import { useState } from "react";
import Markdown from "../Markdown";
import QaModal from "./QaModal";
import { summarize, toSelection } from "./qa-utils";

// The message in the chat for a set of questions. While it is the newest message
// the pop-up opens by itself; closing it leaves an "Answer" button here.
export default function QaMessage({ message, active, answered, onSelect }) {
  const { body, questions } = message.content;
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const open = active && !dismissed;

  const setAnswer = (questionId, patch) =>
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));

  const submit = () => {
    onSelect(summarize(questions, answers), toSelection(message.id, questions, answers));
  };

  return (
    <div className="max-w-md rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4">
      {body && <Markdown>{body}</Markdown>}

      <div className={`flex items-center justify-between gap-3 ${body ? "mt-3" : ""}`}>
        <span className="text-sm text-zinc-300">
          {questions.length === 1 ? "1 question" : `${questions.length} questions`}
        </span>

        {answered ? (
          <span className="text-sm text-indigo-300">✓ Answered</span>
        ) : active ? (
          <button
            onClick={() => setDismissed(false)}
            className="cursor-pointer rounded-lg border border-indigo-400/60 px-3 py-1.5 text-sm text-indigo-200 transition-colors hover:bg-indigo-500/15"
          >
            Answer
          </button>
        ) : (
          <span className="text-sm text-zinc-500">Closed</span>
        )}
      </div>

      {open && (
        <QaModal
          questions={questions}
          step={step}
          answers={answers}
          onAnswer={setAnswer}
          onBack={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(questions.length - 1, s + 1))}
          onSubmit={submit}
          onClose={() => setDismissed(true)}
        />
      )}
    </div>
  );
}