export async function callN8n(name, payload) {
  const prefix = process.env.N8N_WEBHOOK_PREFIX ?? "webhook";
  const base = process.env.N8N_BASE_URL.replace(/\/+$/, "");
  const url = [base, prefix, name].filter(Boolean).join("/");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(90_000),
  });

  if (res.status === 404) {
    console.error(`n8n 404 for ${url}:`, (await res.text()).slice(0, 300));
    const err = new Error(`n8n webhook "${name}" not found (404)`);
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`n8n responded ${res.status} for ${url}`);
    err.status = 502;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}