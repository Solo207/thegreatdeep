import { createContext, useContext } from "react";

export const RightSidebarContext = createContext(null);
export const useRightSidebar = () => useContext(RightSidebarContext);