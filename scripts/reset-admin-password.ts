/**
 * Resets the admin user's password via the Supabase admin API — a reliable
 * fallback when the dashboard's own reset UI can't be found.
 *
 * Run: npm run reset-admin-password -- you@example.com
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createAdminClient } from "@/lib/supabase/admin";
import { generateStrongPassword } from "@/lib/generate-password";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run reset-admin-password -- you@example.com");
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to look up users:", listError.message);
    process.exit(1);
  }

  const user = list.users.find((u) => u.email === email);
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  const password = generateStrongPassword();
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });

  if (error) {
    console.error("Failed to reset password:", error.message);
    process.exit(1);
  }

  console.log(`Password reset for ${email}`);
  console.log(`New password: ${password}`);
  console.log("\nSave this now — it won't be shown again. Log in at /admin/login.");
}

main();
