// Where a floating menu should appear for a right click: at the mouse.
// (The keyboard "menu" key reports 0,0, so then the element's own box is used.)
export function cursorRect(e, element) {
  if (e.clientX === 0 && e.clientY === 0 && element) return element.getBoundingClientRect();
  return {
    left: e.clientX,
    right: e.clientX,
    top: e.clientY,
    bottom: e.clientY,
    width: 0,
    height: 0,
  };
}