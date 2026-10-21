import crypto from "crypto";

// Checks the secret that n8n (or any backend) sends in the X-Callback-Secret header.
// It is compared without leaking timing information.
export function secretOk(req) {
  const given = Buffer.from(String(req.get("x-callback-secret") ?? ""));
  const expected = Buffer.from(process.env.N8N_CALLBACK_SECRET ?? "");
  return (
    expected.length > 0 &&
    given.length === expected.length &&
    crypto.timingSafeEqual(given, expected)
  );
}