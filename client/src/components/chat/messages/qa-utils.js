const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// the longest answer a person can type into an "input" option
export const QA_INPUT_MAX_LENGTH = 200;

const typedText = (answer, optionId) => (answer?.texts?.[optionId] ?? "").trim();
const norm = (s) => s.trim().toLowerCase();

// is this question answered well enough to move on?
export function isAnswered(question, answer) {
  const opt = question.options.find((o) => o.id === answer?.optionId);
  if (!opt) return false;
  if (opt.kind === "input") return typedText(answer, opt.id).length > 0; // a typed answer can't be empty
  return true;
}

// the answer as a short piece of text
function answerLabel(question, answer) {
  const opt = question.options.find((o) => o.id === answer?.optionId);
  if (!opt) return "";
  return opt.kind === "input" ? typedText(answer, opt.id) : opt.label;
}

// What the user's chat bubble says, one line per question:  1. question → answer
// matchAnswers() below reads this same format back.
export function summarize(questions, answers) {
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

// Compares the user's next message with the questions.
// Returns [{ question, optionId, kind, text }] when it answers ALL of them, otherwise null.
export function matchAnswers(questions, userText) {
  if (typeof userText !== "string") return null;
  const lines = userText.split("\n");
  const result = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const prefix = `${i + 1}. ${clip(q.text, 80)} → `;
    const line = lines.find((l) => l.startsWith(prefix));
    if (line === undefined) return null;

    const answer = line.slice(prefix.length).trim();
    if (!answer) return null;

    // equal to one of the choices?  otherwise it must be what was typed into an input option
    const choice = q.options.find((o) => o.kind === "choice" && norm(o.label) === norm(answer));
    const input = q.options.find((o) => o.kind === "input");
    if (choice) result.push({ question: q, optionId: choice.id, kind: "choice", text: choice.label });
    else if (input) result.push({ question: q, optionId: input.id, kind: "input", text: answer });
    else return null;
  }
  return result;
}

// a questions message that has nothing to show in the chat (unanswered, no text of its own)
export function isQaHidden(message, nextUserText) {
  if (message.type !== "qa") return false;
  if (message.content.body) return false;
  return !(nextUserText !== null && matchAnswers(message.content.questions, nextUserText));
}