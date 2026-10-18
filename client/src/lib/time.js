// createdAt usually arrives as text such as "10 hours ago" and is shown as it is.
// A real date (ISO) is turned into the same kind of text.
export function describeTime(value) {
  if (value == null || value === "") return "";
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(text)) return text;

  const then = new Date(text).getTime();
  if (Number.isNaN(then)) return text;

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(then).toLocaleDateString();
}