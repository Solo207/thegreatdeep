import { useState } from "react";
import { useParams } from "react-router-dom";
import { downloadDoc } from "../../../lib/api/chats";

// hands a file to the browser as a download
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// A long horizontal download button for a document. It can be tapped any number of times.
// Nothing is sent to the chat: the browser just starts a download.
export default function DocsMessage({ message }) {
  const { chatId } = useParams();
  const { body, filetype, link } = message.content;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const tap = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { blob, filename } = await downloadDoc(chatId, message.id, {
        link,
        name: body,
        filetype,
      });
      saveBlob(blob, filename);
    } catch (err) {
      setError(
        err.kind === "not_found"
          ? "This document isn't available."
          : "Couldn't download the document. Tap to try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={tap}
        disabled={busy}
        aria-label={body || "Document"}
        className={`flex w-full max-w-md items-center gap-3 rounded-xl border border-indigo-400/60 px-4 py-3 text-left text-indigo-100 transition-colors ${
          busy ? "cursor-wait opacity-70" : "cursor-pointer hover:bg-indigo-500/15"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 shrink-0"
        >
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        </svg>

        <span className="min-w-0 flex-1 truncate">{body || "Document"}</span>

        {filetype && (
          <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-xs uppercase">
            {filetype}
          </span>
        )}

        {busy ? (
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 shrink-0"
          >
            <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
          </svg>
        )}
      </button>

      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}