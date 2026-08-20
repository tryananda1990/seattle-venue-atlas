"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setNewPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    redirect(`/admin/reset-password?error=${encodeURIComponent("Passwords don't match.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Set via the admin API, not the session-based updateUser(): this project
  // requires current_password on updateUser() even during a recovery
  // session, which would make "forgot password" impossible by definition
  // (not knowing the old password is the whole premise). The valid recovery
  // session — proven by getUser() succeeding, established by clicking the
  // emailed link — is the identity check here instead.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { password });

  if (error) {
    redirect(`/admin/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin?passwordReset=1");
}
