import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import SidebarToggle from "./sidebar/SidebarToggle";
import HistoryProvider from "./sidebar/HistoryProvider";
import useSidebarState from "./sidebar/useSidebarState";
import { SIDEBAR_SLIDE_MS } from "./sidebar/config";

export default function AppShell() {
  const { isDesktop, isOpen, toggle, closeDrawer, peek, startPeek, endPeek } =
    useSidebarState();

  // on small screens, close the drawer after tapping a link
  const afterNavigate = () => {
    if (!isDesktop) closeDrawer();
  };

  return (
    <HistoryProvider>
      <div className="flex h-dvh bg-zinc-900 text-zinc-100">
        {/* big screens, pinned open: the sidebar sits beside the page */}
        {isDesktop && isOpen && (
          <Sidebar onToggle={toggle} onNavigate={afterNavigate} />
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
              <SidebarToggle onClick={toggle} />
            </div>

            <div
              style={{ transitionDuration: `${SIDEBAR_SLIDE_MS}ms` }}
              className={`absolute left-0 top-0 h-dvh shadow-2xl transition-all ease-out ${
                peek
                  ? "visible translate-x-0 opacity-100"
                  : "pointer-events-none invisible -translate-x-8 opacity-0"
              }`}
            >
              <Sidebar onToggle={toggle} onNavigate={afterNavigate} />
            </div>
          </div>
        )}

        {/* small screens: the sidebar slides over the page as a drawer */}
        {!isDesktop && isOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/60"
              onClick={closeDrawer}
            />
            <div className="fixed inset-y-0 left-0 z-40">
              <Sidebar onToggle={toggle} onNavigate={afterNavigate} />
            </div>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* reserved strip so page content never sits under the icon */}
          {!isOpen && (
            <div className="h-[60px] shrink-0 p-3">
              {!isDesktop && <SidebarToggle onClick={toggle} />}
            </div>
          )}
          <main className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </HistoryProvider>
  );
}