"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function changePassword(formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    redirect(`/admin/account?error=${encodeURIComponent("New passwords don't match.")}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
    current_password: currentPassword,
  });

  if (error) {
    redirect(`/admin/account?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/account?success=1");
}
