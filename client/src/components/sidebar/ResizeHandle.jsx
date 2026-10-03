import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
} from "./config";

export default function ResizeHandle({ width, onResize }) {
  const handlePointerDown = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId); // keep receiving moves even outside the handle
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMove = (ev) => onResize(ev.clientX); // the sidebar starts at x = 0
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

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") onResize(width - 16);
    if (e.key === "ArrowRight") onResize(width + 16);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuenow={width}
      aria-valuemin={SIDEBAR_MIN_WIDTH}
      aria-valuemax={SIDEBAR_MAX_WIDTH}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => onResize(SIDEBAR_DEFAULT_WIDTH)}
      className="absolute right-0 top-0 z-10 h-full w-1.5 translate-x-1/2 cursor-col-resize touch-none transition-colors hover:bg-indigo-500/50 focus-visible:bg-indigo-500/50 active:bg-indigo-500"
    />
  );
}