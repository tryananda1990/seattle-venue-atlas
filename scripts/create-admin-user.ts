/**
 * One-time setup: creates the single admin user in Supabase Auth.
 *
 * Run: npm run create-admin -- you@example.com
 *
 * Generates a random password, creates the user via the secret-key admin
 * client (bypasses email confirmation — there's no email server involved,
 * this is a single-admin internal tool), and prints the password once.
 * To change it later, use `npm run reset-admin-password -- <email>`.
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createAdminClient } from "@/lib/supabase/admin";
import { generateStrongPassword } from "@/lib/generate-password";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run create-admin -- you@example.com");
    process.exit(1);
  }

  const password = generateStrongPassword();
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Failed to create admin user:", error.message);
    process.exit(1);
  }

  console.log(`Admin user created: ${data.user.email}`);
  console.log(`Password: ${password}`);
  console.log("\nSave this password now — it won't be shown again. Log in at /admin/login.");
}

main();
