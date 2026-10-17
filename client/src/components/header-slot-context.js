import { createContext } from "react";

// The spot in the top strip, next to the sidebar button, where a page's title can sit.
// It is null while the strip isn't on screen.
export const HeaderSlotContext = createContext(null);