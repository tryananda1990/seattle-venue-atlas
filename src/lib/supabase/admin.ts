import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Secret-key client — bypasses RLS. Never import this from a Client Component
 * or expose SUPABASE_SECRET_KEY to the browser. Use only in Route Handlers
 * and Server Actions that already gate on the admin session, or in
 * scripts/discover.ts (run via plain Node/tsx, where `server-only` would
 * throw unconditionally — so it's intentionally not imported here).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}
