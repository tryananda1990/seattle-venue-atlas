"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifyPin,
} from "@/lib/admin-auth";

export async function login(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  // Small fixed delay to blunt automated PIN-guessing.
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!verifyPin(pin)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });

  redirect(next || "/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: ADMIN_SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
