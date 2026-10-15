import { useMemo, useState } from "react";
import QaModal from "../../components/chat/messages/QaModal";

// "Got it — title. description / Want to add a timer?"
// Yes: a box that takes minutes only (1 to 150). No: just send the link.
export default function TimerModal({ item, onSubmit, onClose }) {
  const [answers, setAnswers] = useState({});

  const questions = useMemo(
    () => [
      {
        id: "timer",
        text: `Got it — ${[item.title, item.description].filter(Boolean).join(". ")}\nWant to add a timer?`,
        options: [
          {
            id: "yes",
            kind: "input",
            label: "Yes, add timer in minutes (150 max)",
            numeric: { min: 1, max: 150 },
          },
          { id: "no", kind: "choice", label: "No, send link" },
        ],
      },
    ],
    [item]
  );

  const setAnswer = (questionId, patch) =>
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));

  const submit = () => {
    const a = answers.timer;
    // Yes: the minutes that were typed. No: 0.
    const minutes = a?.optionId === "yes" ? Number(a.texts?.yes ?? 0) : 0;
    onSubmit(minutes);
  };

  return (
    <QaModal
      questions={questions}
      step={0}
      answers={answers}
      submitLabel="Continue"
      onAnswer={setAnswer}
      onBack={() => {}}
      onNext={() => {}}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}