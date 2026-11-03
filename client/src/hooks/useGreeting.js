import { useEffect, useState } from "react";
import { getGreeting } from "../lib/api/account";

const FALLBACK_AFTER_MS = 2000;

export default function useGreeting(firstName) {
  const fallback = firstName ? `Hi ${firstName}, what are we studying?` : "What are we studying?";
  const [custom, setCustom] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ignore = false;
    // if n8n is slow, show the default after 2 s instead of leaving a gap
    const timer = setTimeout(() => !ignore && setReady(true), FALLBACK_AFTER_MS);
    getGreeting()
      .then((text) => {
        if (ignore) return;
        if (text) setCustom(text);
        setReady(true);
      })
      .catch(() => !ignore && setReady(true));
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, []);

  return { text: custom || fallback, ready };
}