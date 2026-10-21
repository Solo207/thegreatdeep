import { createContext, useContext } from "react";

// toast("Chat renamed")  or  toast("Something went wrong", "error")
export const ToastContext = createContext(() => {});

// notify("Can you summarize this page? <<https://…>>"): a longer notice (10 seconds)
export const NoticeContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function useNotice() {
  return useContext(NoticeContext);
}