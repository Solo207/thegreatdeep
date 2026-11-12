import { useEffect } from "react";
import { useMatch, useSearchParams } from "react-router-dom";
import { RightSidebarContext } from "./right-sidebar-context";
import useRightSidebarState from "./useRightSidebarState";
import useOutline from "./useOutline";

export default function RightSidebarProvider({ children }) {
  const match = useMatch("/chat/:chatId");
  const [params] = useSearchParams();
  const chatId = match?.params.chatId ?? null;

  // only on /chat/:id, and not while the profile page is open
  const available = Boolean(chatId) && !params.has("profile");

  const state = useRightSidebarState();
const { links, status, refresh, add } = useOutline(chatId);

  // the chat sent a message (or its reply finished): ask n8n again
  useEffect(() => {
    const on = () => refresh();
    window.addEventListener("outline:refresh", on);
    return () => window.removeEventListener("outline:refresh", on);
  }, [refresh]);

  useEffect(() => {
  const on = (e) => add(e.detail);
  window.addEventListener("outline:add", on);
  return () => window.removeEventListener("outline:add", on);
}, [add]);

  // a different chat: a phone drawer starts closed
  const { closeDrawer } = state;
  useEffect(() => {
    closeDrawer();
  }, [chatId, closeDrawer]);

  return (
    <RightSidebarContext.Provider value={{ available, chatId, links, status, refresh, ...state }}>
      {children}
    </RightSidebarContext.Provider>
  );
}