const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// line breaks and repeated spaces become single spaces
const flat = (s) => s.replace(/\s+/g, " ").trim();
const norm = (s) => flat(s).toLowerCase();

// the longest answer a person can type into an "input" option
export const QA_INPUT_MAX_LENGTH = 200;

const typedText = (answer, optionId) => (answer?.texts?.[optionId] ?? "").trim();

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

// The marker that starts each question's part of the user's message:  "1. question → "
// (line breaks inside a long question are flattened, so each answer stays on one line)
const markerFor = (q, i) => `${i + 1}. ${flat(clip(q.text, 80))} → `;

// What the user's chat bubble says, one line per question:  1. question → answer
export function summarize(questions, answers) {
  return questions
    .map((q, i) => `${markerFor(q, i)}${clip(answerLabel(q, answers[q.id]), 200)}`)
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
  const text = flat(userText);

  // find where each question's marker sits (the first one must open the message)
  const markers = questions.map((q, i) => flat(markerFor(q, i)) + " ");
  const starts = [];
  let from = 0;
  for (let i = 0; i < markers.length; i++) {
    const at = text.indexOf(markers[i].trimEnd(), from);
    if (at === -1 || (i === 0 && at !== 0)) return null;
    starts.push(at);
    from = at + markers[i].trimEnd().length;
  }

  const result = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const answerStart = starts[i] + markers[i].trimEnd().length;
    const answerEnd = i + 1 < questions.length ? starts[i + 1] : text.length;
    const answer = text.slice(answerStart, answerEnd).trim();
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