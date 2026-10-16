// Screens at least this wide (in px) get the permanent sidebar.
// Narrower screens get a menu icon that opens the sidebar as a drawer.
export const SIDEBAR_BREAKPOINT = 623;
// How long the hover-reveal slide takes, in milliseconds. Bigger = slower.
export const SIDEBAR_SLIDE_MS = 350;
// Sidebar width on large screens, in px. Drag its right edge to resize,
// double-click the edge to reset.
export const SIDEBAR_DEFAULT_WIDTH = 288; // was 256
export const SIDEBAR_MIN_WIDTH = 220;
export const SIDEBAR_MAX_WIDTH = 480;
// The swipe that opens the sidebar.
// "right" = finger moves left to right (the usual way to pull out a left-hand sidebar).
// "left"  = finger moves right to left. The opposite swipe closes the drawer.
export const SIDEBAR_SWIPE_OPEN = "right";