"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setNewPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    redirect(`/admin/reset-password?error=${encodeURIComponent("Passwords don't match.")}`);
  }

  const supabase = await createClient();

  // No current_password here: this only runs inside a recovery session
  // established by clicking the emailed link, which is the whole point of
  // "forgot password" — the user doesn't know their current one.
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/admin/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin?passwordReset=1");
}
