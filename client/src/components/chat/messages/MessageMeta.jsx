import { useState } from "react";
import { describeTime } from "../../../lib/time";

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // older browsers, or a page that isn't https
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// The tiny line under a message: a copy icon and the time.
//   text       what the copy icon copies
//   createdAt  the time text of the message (e.g. "10 hours ago")
export default function MessageMeta({ text, createdAt, align = "left" }) {
  const [copied, setCopied] = useState(false);
  const time = describeTime(createdAt);
  if (!text && !time) return null;

  const copy = async () => {
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      className={`mt-1 flex items-center gap-2 text-xs text-zinc-500 ${
        align === "right" ? "justify-end" : ""
      }`}
    >
      {text && (
        <button
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy message"}
          title={copied ? "Copied" : "Copy"}
          className="flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-colors hover:text-zinc-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            {copied ? (
              <path d="M5 12l5 5L20 7" />
            ) : (
              <>
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V6a2 2 0 0 1 2-2h9" />
              </>
            )}
          </svg>
        </button>
      )}
      {time && <span>{time}</span>}
    </div>
  );
}