const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const typedText = (answer, optionId) => (answer?.texts?.[optionId] ?? "").trim();

// is this question answered well enough to move on?
export function isAnswered(question, answer) {
  const opt = question.options.find((o) => o.id === answer?.optionId);
  if (!opt) return false;
  if (opt.kind === "input") return !opt.input.required || typedText(answer, opt.id).length > 0;
  return true;
}

// the answer as a short piece of text
function answerLabel(question, answer) {
  const opt = question.options.find((o) => o.id === answer?.optionId);
  if (!opt) return "";
  if (opt.kind === "input") return typedText(answer, opt.id) || opt.label;
  return opt.label;
}

// what the user's chat bubble says
export function summarize(questions, answers) {
  if (questions.length === 1) {
    return clip(answerLabel(questions[0], answers[questions[0].id]), 1000);
  }
  return questions
    .map(
      (q, i) =>
        `${i + 1}. ${clip(q.text, 80)} → ${clip(answerLabel(q, answers[q.id]), 200)}`
    )
    .join("\n");
}

// the same answers as data, for n8n
export function toSelection(messageId, questions, answers) {
  return {
    source: "qa",
    messageId,
    answers: questions.map((q) => {
      const a = answers[q.id];
      const opt = q.options.find((o) => o.id === a.optionId);
      return {
        questionId: q.id,
        optionId: opt.id,
        kind: opt.kind,
        text: opt.kind === "input" ? typedText(a, opt.id) : undefined,
      };
    }),
  };
}