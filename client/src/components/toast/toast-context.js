import { createContext, useContext } from "react";

// toast("Chat renamed")  or  toast("Something went wrong", "error")
export const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}