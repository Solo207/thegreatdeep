import { useState } from "react";
import Markdown from "../Markdown";
import QaModal from "./QaModal";
import { matchAnswers, summarize, toSelection } from "./qa-utils";

// Questions are asked in a pop-up. In the chat they only appear once answered:
// each question with the answer that was picked or typed. Unanswered ones show nothing.
export default function QaMessage({ message, active, nextUserText, onSelect }) {
  const { body, questions } = message.content;
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  // answered = the user's next message answers every question
  const given = nextUserText !== null ? matchAnswers(questions, nextUserText) : null;
  const open = active && !dismissed && !given;

  const setAnswer = (questionId, patch) =>
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));

  const submit = () => {
    onSelect(summarize(questions, answers), toSelection(message.id, questions, answers));
  };

  return (
    <div>
      {body && <Markdown>{body}</Markdown>}

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