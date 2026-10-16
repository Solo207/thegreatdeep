import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import SidebarToggle from "./sidebar/SidebarToggle";
import HistoryProvider from "./sidebar/HistoryProvider";
import EventsProvider from "./events/EventsProvider";
import useSidebarState from "./sidebar/useSidebarState";
import useVisualViewportHeight from "../hooks/useVisualViewportHeight";
import { SIDEBAR_SLIDE_MS, SIDEBAR_SWIPE_OPEN } from "./sidebar/config";
import { requestChatFocus } from "../lib/keyboard";
import useSwipe from "./sidebar/useSwipe";
import RoughbooksProvider from "./roughbooks/RoughbooksProvider";

export default function AppShell() {
  const {
    isDesktop, isOpen, toggle, closeDrawer,
    peek, startPeek, endPeek,
    width, setWidth,
  } = useSidebarState();
  const viewportHeight = useVisualViewportHeight();
  const onNewChat = useLocation().pathname === "/new";

  // On a phone, closing the drawer while on /new brings up the keyboard.
  // (It happens inside the tap, which is when phones allow it.)
  const closeDrawerAndFocus = () => {
    closeDrawer();
    if (onNewChat) requestChatFocus();
  };
  const toggleAndFocus = () => {
    const closingDrawer = !isDesktop && isOpen;
    toggle();
    if (closingDrawer && onNewChat) requestChatFocus();
  };

  // on small screens, close the drawer after tapping a link
  const afterNavigate = () => {
    if (!isDesktop) closeDrawer();
  };

    // a swipe brings the sidebar in; the opposite swipe sends the drawer away
  const openBySwipe = () => {
    if (!isOpen) toggle();
  };
  const closeBySwipe = () => {
    if (!isDesktop && isOpen) closeDrawerAndFocus();
  };
  useSwipe({
    onSwipeRight: SIDEBAR_SWIPE_OPEN === "right" ? openBySwipe : closeBySwipe,
    onSwipeLeft: SIDEBAR_SWIPE_OPEN === "left" ? openBySwipe : closeBySwipe,
  });

  return (
    <EventsProvider>
      <HistoryProvider>
        <div
          style={{ height: viewportHeight }}
          className="flex overflow-hidden bg-zinc-900 text-zinc-100"
        >
          {/* invisible field that lets phones open the keyboard for the /new box */}
          <input
            id="keyboard-bridge"
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
            className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0"
          />

          {/* big screens, pinned open: the sidebar sits beside the page */}
          {isDesktop && isOpen && (
            <Sidebar
              width={width}
              maxWidth="50vw"
              onResize={setWidth}
              onToggle={toggleAndFocus}
              onNavigate={afterNavigate}
            />
          )}

          {/* big screens, hidden: hovering the icon eases the sidebar in
              until the mouse leaves it */}
          {isDesktop && !isOpen && (
            <div
              data-peek-zone
              className="fixed left-0 top-0 z-40"
              onMouseEnter={startPeek}
              onMouseLeave={endPeek}
            >
              <div className="p-3">
                <SidebarToggle onClick={toggleAndFocus} />
              </div>

              <div
                style={{ transitionDuration: `${SIDEBAR_SLIDE_MS}ms` }}
                className={`absolute left-0 top-0 h-dvh shadow-2xl transition-all ease-out ${
                  peek
                    ? "visible translate-x-0 opacity-100"
                    : "pointer-events-none invisible -translate-x-8 opacity-0"
                }`}
              >
                <Sidebar
                  width={width}
                  maxWidth="50vw"
                  onResize={setWidth}
                  onToggle={toggleAndFocus}
                  onNavigate={afterNavigate}
                />
              </div>
            </div>
          )}

          {/* small screens: the sidebar slides over the page as a drawer */}
          {!isDesktop && isOpen && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/60"
                onClick={closeDrawerAndFocus}
              />
              <div className="fixed inset-y-0 left-0 z-40">
                <Sidebar onToggle={toggleAndFocus} onNavigate={afterNavigate} />
              </div>
            </>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {/* reserved strip so page content never sits under the icon */}
            {!isOpen && (
              <div className="h-[60px] shrink-0 p-3">
                {!isDesktop && <SidebarToggle onClick={toggleAndFocus} />}
              </div>
            )}
            <main className="flex min-h-0 flex-1 flex-col">
              <Outlet />
            </main>
          </div>
        </div>
      </HistoryProvider>
    </EventsProvider>
  );
}