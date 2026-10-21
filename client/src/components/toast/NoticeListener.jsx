import { useEffect } from "react";
import { useEvents } from "../events/events-context";
import { useNotice } from "./toast-context";

// Shows a notice whenever the server pushes one, on whatever screen the user is on.
export default function NoticeListener() {
  const { subscribe } = useEvents();
  const notify = useNotice();

  useEffect(
    () =>
      subscribe((evt) => {
        if (evt.type === "notice" && evt.text) notify(evt.text);
      }),
    [subscribe, notify]
  );

  return null;
}