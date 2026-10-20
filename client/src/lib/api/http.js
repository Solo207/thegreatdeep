// Reads the server's JSON answer. If the server says { redirect: "https://…" }, the whole
// page goes there (same tab) and the caller never gets an answer, so nothing flashes an
// error on the way out.
export async function unwrap(res) {
  const data = await res.json();
  if (data && typeof data.redirect === "string" && /^https?:\/\//i.test(data.redirect)) {
    window.location.assign(data.redirect);
    return new Promise(() => {});
  }
  return data;
}