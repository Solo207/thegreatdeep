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

// GET an n8n webhook and hand back the raw response, for files that are
// streamed on to the browser. The details travel as a query string.
export async function getN8nFile(name, params, signal) {
  const prefix = process.env.N8N_WEBHOOK_PREFIX || "webhook";
  const url = new URL(`${process.env.N8N_BASE_URL}/${prefix}/${name}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    method: "GET",
    headers: { "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET },
    signal,
  });

  if (res.status === 404) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`n8n responded ${res.status}`);
    err.status = 502;
    throw err;
  }
  return res;
}

// For actions where only "did it work?" matters (delete, pin, rename...):
// any 2xx answer counts as success, whatever the body looks like.
// If n8n answers with an error, it is logged here, so you can see why.
export async function actionN8n(name, payload) {
  const prefix = process.env.N8N_WEBHOOK_PREFIX || "webhook";
  const res = await fetch(`${process.env.N8N_BASE_URL}/${prefix}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(90_000),
  });

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`[n8n ${name}] answered ${res.status}: ${body.slice(0, 200)}`);
    const err = new Error(`n8n responded ${res.status}`);
    err.status = res.status === 404 ? 404 : 502;
    throw err;
  }
}