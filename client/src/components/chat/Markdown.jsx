import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import "katex/contrib/mhchem"; // chemistry shorthand, e.g. \ce{H2O}

const remarkPlugins = [remarkGfm, remarkMath];
// throwOnError: false means a broken formula is shown as text instead of crashing the reply
const rehypePlugins = [[rehypeKatex, { throwOnError: false, strict: false }]];

// Many AI models write math as \( ... \) and \[ ... \].
// Convert those to $ ... $ and $$ ... $$, which the renderer understands.
function normalizeMath(text) {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m}$`);
}
// How each markdown element looks
const components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-6 text-xl font-semibold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 text-lg font-semibold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-4 text-base font-semibold">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1 mt-3 font-semibold">{children}</h4>
  ),
  p: ({ children }) => <p className="my-3 leading-7">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-50">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-7 marker:text-zinc-500">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-zinc-600 pl-4 text-zinc-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-zinc-700" />,

  // code: a small chip inline, a boxed block when fenced
  code: ({ children }) => (
    <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),

  // tables: an outline box around the whole table, scrolls sideways if too wide
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-zinc-600">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-800/70">{children}</thead>,
  th: ({ children, style }) => (
    <th
      style={style}
      className="border-r border-zinc-700 px-4 py-2 font-semibold last:border-r-0"
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td
      style={style}
      className="border-r border-t border-zinc-700 px-4 py-2 align-top last:border-r-0"
    >
      {children}
    </td>
  ),
};

export default function Markdown({ children }) {
  return (
    <div className="break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {normalizeMath(children)}
      </ReactMarkdown>
    </div>
  );
}