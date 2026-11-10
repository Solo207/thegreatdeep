const ID_RE = /^[\w-]{1,100}$/;

/** n8n's /rightsb answer -> [{ id, title }]. Accepts { links }, [{ links }] or a bare list. */
export function linksFrom(data) {
  const first = Array.isArray(data) ? data[0] : data;
  let list = [];
  if (Array.isArray(first?.links)) list = first.links;
  else if (Array.isArray(data) && data.every((d) => d && typeof d === "object" && "id" in d)) list = data;

  return list
    .map((l) => ({
      id: String(l?.id ?? ""),
      title: String(l?.title ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 120) || "Untitled",
    }))
    .filter((l) => ID_RE.test(l.id))
    .slice(0, 200);
}