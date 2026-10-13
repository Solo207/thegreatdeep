import { Fragment } from "react";
import { splitLinks } from "../../lib/links";

// Plain text in which web addresses are clickable links (opened in a new tab)
export default function LinkedText({ text, linkClass = "" }) {
  return splitLinks(text).map((part, i) =>
    part.href ? (
      <a
        key={i}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {part.text}
      </a>
    ) : (
      <Fragment key={i}>{part.text}</Fragment>
    )
  );
}