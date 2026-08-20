import crypto from "node:crypto";

/** Meets Supabase's default policy: upper, lower, digit, and a special char. */
export function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*-_=+";
  const all = upper + lower + digits + special;

  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(special)];
  const rest = Array.from({ length: 16 }, () => pick(all));

  return [...required, ...rest].sort(() => crypto.randomInt(3) - 1).join("");
}
