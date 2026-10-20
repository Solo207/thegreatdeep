function icon(path) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      {path}
    </svg>
  );
}

// small icons for the floating menus
export const ICONS = {
  pin: icon(<path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7" />),
  rename: icon(<path d="M4 20h4L19 9l-4-4L4 16z" />),
  trash: icon(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />),
  folder: icon(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />),
  plus: icon(<path d="M12 5v14M5 12h14" />),
  remove: icon(<path d="M6 6l12 12M18 6L6 18" />),
  check: icon(<path d="M5 12l5 5L20 7" />),
  chevron: icon(<path d="M6 9l6 6 6-6" />),
  user: icon(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  logout: icon(<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />),
  settings: icon(
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
};