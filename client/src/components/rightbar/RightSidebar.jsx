import { useEffect, useRef } from "react";
import { useRightSidebar } from "./right-sidebar-context";
import RightToggle from "./RightToggle";
import RightResizeHandle from "./RightResizeHandle";
import useActiveQuestion from "./useActiveQuestion";
import { RIGHT_SLIDE_MS } from "./config";
import { closeKeyboard } from "../../lib/keyboard";
import { jumpToMessage } from "./jump";

function Panel({ r, width, resizable = false, onToggle, active = false, activeIndex, onPick }) {
  const navRef = useRef(null);
  const empty = r.links.length === 0;

  // a long list follows the current question
  useEffect(() => {
    navRef.current
      ?.querySelector("[aria-current='true']")
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  return (
    <aside style={{ width }} className="relative flex h-full shrink-0 flex-col bg-zinc-900">
      {resizable && <RightResizeHandle width={r.width} onResize={r.setWidth} />}

      <div className="flex h-12 shrink-0 items-center justify-between pl-4 pr-3">
        <h2 className="text-xs font-semibold tracking-wider text-zinc-400">ON THIS PAGE</h2>
        {onToggle && <RightToggle onClick={onToggle} active={active} />}
      </div>

      <nav ref={navRef} aria-label="On this page" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {empty && (r.status === "loading" || r.status === "idle") && (
          <div className="flex flex-col gap-2 px-1">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-zinc-800/60" />
            ))}
          </div>
        )}

        {empty && r.status === "error" && (
          <p className="px-3 py-2 text-sm text-zinc-400">
            Couldn't load this list.{" "}
            <button onClick={r.refresh} className="underline hover:text-zinc-100">
              Retry
            </button>
          </p>
        )}

        {empty && r.status === "ready" && (
          <p className="px-3 py-2 text-sm text-zinc-500">Your questions will show up here.</p>
        )}

        <ul className="flex flex-col gap-0.5">
          {r.links.map((link, i) => {
            const current = i === activeIndex;
            return (
              <li key={link.id}>
                <button
                  onClick={() => onPick(link, i)}
                  title={link.title}
                  aria-current={current ? "true" : undefined}
                  className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800 ${
                    current ? "text-indigo-300" : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {/* the clamp has to be on an inner element: a button ignores it */}
                  <span className="line-clamp-2 wrap-anywhere">{link.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

// Lives inside the chat page, below the header, so it starts under the header line.
export default function RightSidebar() {
  const r = useRightSidebar();
  const { spy, choose } = useActiveQuestion(Boolean(r?.available));

  if (!r || !r.available) return null;

  // which row is current: by the question's id, otherwise by its place in the list
  const byId = r.links.findIndex((l) => l.id === spy.id);
  const activeIndex = r.links.length ? (byId >= 0 ? byId : Math.min(spy.index, r.links.length - 1)) : -1;

  const pick = (link, i) => {
    choose(link.id, i);
    jumpToMessage(link.id, i);
    if (!r.isDocked) r.closeDrawer();
  };

  const toggle = () => {
    if (!r.isDocked && !r.isOpen) closeKeyboard(); // the drawer must not sit beside an open keyboard
    r.toggle();
  };

  const panelProps = { r, activeIndex, onPick: pick };

  // big screens, open: the bar sits beside the chat
  if (r.isDocked && r.isOpen) {
    return <Panel {...panelProps} width={r.width} resizable onToggle={toggle} active />;
  }

  // big screens, hidden: a floating icon at the edge; hovering it eases the bar in
  if (r.isDocked) {
    return (
      <div
        data-right-peek-zone
        className="pointer-events-none absolute inset-y-0 right-0 z-30"
        onMouseEnter={r.startPeek}
        onMouseLeave={r.endPeek}
      >
        <div className="pointer-events-auto absolute right-0 top-0 p-3">
          <RightToggle onClick={toggle} />
        </div>
        <div
          style={{ transitionDuration: `${RIGHT_SLIDE_MS}ms` }}
          className={`absolute right-0 top-0 h-full shadow-2xl transition-all ease-out ${
            r.peek
              ? "pointer-events-auto visible translate-x-0 opacity-100"
              : "pointer-events-none invisible translate-x-8 opacity-0"
          }`}
        >
          <Panel {...panelProps} width={r.width} resizable onToggle={toggle} />
        </div>
      </div>
    );
  }

  // smaller screens: a floating icon, and the bar slides over the chat as a drawer
  return (
    <>
      <div className="absolute right-3 top-3 z-20">
        <RightToggle onClick={toggle} />
      </div>
      {r.isOpen && (
        <>
          <div className="absolute inset-0 z-30 bg-black/60" onClick={r.closeDrawer} />
          <div className="absolute inset-y-0 right-0 z-40 shadow-2xl">
            <Panel {...panelProps} width="min(20rem, 85vw)" onToggle={toggle} active />
          </div>
        </>
      )}
    </>
  );
}