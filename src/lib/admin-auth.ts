import crypto from "node:crypto";

// No `import "server-only"` here: this module is also imported by
// src/proxy.ts, which runs in a separate (Node) runtime bundle where that
// marker isn't meaningful. Never import this file from a Client Component.

export const ADMIN_SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET!)
    .update(payload)
    .digest("hex");
}

export function createSessionToken(): string {
  const expires = String(Date.now() + SESSION_TTL_SECONDS * 1000);
  return `${expires}.${sign(expires)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig) return false;

  const expectedSig = sign(expires);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  return Number.isFinite(Number(expires)) && Date.now() < Number(expires);
}

/** Constant-time PIN comparison — resists timing attacks that leak the PIN char-by-char. */
export function verifyPin(pin: string): boolean {
  const expected = process.env.ADMIN_PIN ?? "";
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}
