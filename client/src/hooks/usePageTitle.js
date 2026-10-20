import { useEffect } from "react";

const APP_NAME = "RoughBOOK";
// Put text here to add it after every title, e.g. " · RoughBOOK"
const SUFFIX = "";

// Sets the browser tab's title while a page is on screen.
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title}${SUFFIX}` : APP_NAME;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}