import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import SidebarToggle from "./sidebar/SidebarToggle";
import HistoryProvider from "./sidebar/HistoryProvider";
import EventsProvider from "./events/EventsProvider";
import RoughbooksProvider from "./roughbooks/RoughbooksProvider";
import PageBoundary from "./PageBoundary";
import { HeaderSlotContext } from "./header-slot-context";
import useSidebarState from "./sidebar/useSidebarState";
import useSwipe from "./sidebar/useSwipe";
import useVisualViewportHeight from "../hooks/useVisualViewportHeight";
import { SIDEBAR_SLIDE_MS, SIDEBAR_SWIPE_OPEN } from "./sidebar/config";
import { requestChatFocus, closeKeyboard } from "../lib/keyboard";
import ToastProvider from "./toast/ToastProvider";
import NoticeListener from "./toast/NoticeListener";
import NewChatButton from "./NewChatButton";
import ProfilePanel from "./profile/ProfilePanel";
import RightSidebarProvider from "./rightbar/RightSidebarProvider";
import { useRightSidebar } from "./rightbar/right-sidebar-context";

function AppShellInner() {
  const {
    isDesktop, isOpen, toggle, closeDrawer,
    peek, startPeek, endPeek,
    width, setWidth,
  } = useSidebarState();
  const right = useRightSidebar();
  const viewportHeight = useVisualViewportHeight();
  const { pathname } = useLocation();
  const onNewChat = pathname === "/new";

  const showStripNewChat =
    !isDesktop && !pathname.startsWith("/chat/") && pathname !== "/new";
  // the right bar is docked beside the chat: the header should end where the chat ends
const reserveRight = right.available && right.isDocked && right.isOpen;

    // where a page can put its title: the top strip, next to the sidebar button
  const [headerSlot, setHeaderSlot] = useState(null);

  // On a phone, closing the drawer while on /new brings up the keyboard.
  // (It happens inside the tap, which is when phones allow it.)
  const closeDrawerAndFocus = () => {
    closeDrawer();
    if (onNewChat) requestChatFocus();
  };
  const toggleAndFocus = () => {
    const openingDrawer = !isDesktop && !isOpen;
    const closingDrawer = !isDesktop && isOpen;
    toggle();
    if (openingDrawer) closeKeyboard(); // the drawer must not sit beside an open keyboard
    if (closingDrawer && onNewChat) requestChatFocus();
  };

  // on small screens, close the drawer after tapping a link
  const afterNavigate = () => {
    if (!isDesktop) closeDrawer();
  };

  // a swipe brings the sidebar in; the opposite swipe sends the drawer away
  const openBySwipe = () => {
    if (!isOpen) toggleAndFocus();
  };
  const closeBySwipe = () => {
    if (!isDesktop && isOpen) closeDrawerAndFocus();
  };

  // The right bar ("On this page") is a drawer on narrower screens too:
  // swipe left pulls it out, swipe right pushes it away.
  const rightDrawer = right.available && !right.isDocked;
  const swipeRight = () => {
    if (rightDrawer && right.isOpen) return right.closeDrawer();
    (SIDEBAR_SWIPE_OPEN === "right" ? openBySwipe : closeBySwipe)();
  };
  const swipeLeft = () => {
    if (!isDesktop && isOpen) return closeBySwipe(); // the left drawer is open: swipe left closes it
    if (rightDrawer && !right.isOpen) {
      closeKeyboard();
      return right.openDrawer();
    }
    (SIDEBAR_SWIPE_OPEN === "left" ? openBySwipe : closeBySwipe)();
  };
  useSwipe({ onSwipeRight: swipeRight, onSwipeLeft: swipeLeft });

  return (
    <ToastProvider>
    <EventsProvider>
      <HistoryProvider>
        <RoughbooksProvider>
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

            <NoticeListener />

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

            <div className="relative flex min-w-0 flex-1 flex-col">
              {/* top strip: the sidebar button, with the page's title on the same line */}
              {!isOpen && (
                <div
                  style={reserveRight ? { paddingRight: right.width + 12 } : undefined}
                  className={`flex h-15 shrink-0 items-center gap-2 p-3 ${
                    isDesktop ? "pl-15" : ""
                  }`}
                >
                  {!isDesktop && <SidebarToggle onClick={toggleAndFocus} />}
                  <div ref={setHeaderSlot} className="min-w-0 flex-1" />
                  {showStripNewChat && <NewChatButton />}
                </div>
              )}
              <main className="flex min-h-0 flex-1 flex-col">
                <HeaderSlotContext.Provider value={headerSlot}>
                  <PageBoundary key={pathname}>
                    <Outlet />
                  </PageBoundary>
                </HeaderSlotContext.Provider>
              </main>

              <ProfilePanel />
            </div>
          </div>
        </RoughbooksProvider>
      </HistoryProvider>
    </EventsProvider>
    </ToastProvider>
  );
}

export default function AppShell() {
  return (
    <RightSidebarProvider>
      <AppShellInner />
    </RightSidebarProvider>
  );
}