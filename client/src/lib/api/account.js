import { ApiError } from "./chats";
import { unwrap } from "./http";

// "Change user details": clears the history and bookmarks. If n8n answers with a link,
// the page goes there by itself.
export async function resignAccount() {
  let res;
  try {
    res = await fetch("/api/account/resign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    throw new ApiError(0, "network");
  }
  if (!res.ok) throw new ApiError(res.status, "failed");
  return unwrap(res);
}

export async function getProfile() {
  const res = await fetch("/api/account/profile", { credentials: "include" });
  const data = await unwrap(res);
  return data.profile;
}

export async function getGreeting() {
  const res = await fetch("/api/account/greeting", { credentials: "include" });
  const data = await unwrap(res);
  return data.greeting || "";
}