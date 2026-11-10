import { RIGHT_DEFAULT_WIDTH, RIGHT_MIN_WIDTH, RIGHT_MAX_WIDTH } from "./config";

export default function RightResizeHandle({ width, onResize }) {
  const onPointerDown = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMove = (ev) => onResize(window.innerWidth - ev.clientX); // the bar ends at the right edge
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") onResize(width + 16);
    if (e.key === "ArrowRight") onResize(width - 16);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize on this page"
      aria-valuenow={width}
      aria-valuemin={RIGHT_MIN_WIDTH}
      aria-valuemax={RIGHT_MAX_WIDTH}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={() => onResize(RIGHT_DEFAULT_WIDTH)}
      className="group absolute left-0 top-1/2 z-10 flex h-16 w-3 -translate-x-1/2 -translate-y-1/2 cursor-col-resize touch-none items-center justify-center focus-visible:outline-none"
    >
      <span className="h-10 w-0.5 rounded-full bg-zinc-700 transition-colors group-hover:bg-indigo-500/70 group-focus-visible:bg-indigo-500/70 group-active:bg-indigo-500" />
    </div>
  );
}