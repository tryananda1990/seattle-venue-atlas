import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Secret-key client — bypasses RLS. Never import this from a Client Component
 * or expose SUPABASE_SECRET_KEY to the browser. Use only in Route Handlers
 * and Server Actions that already gate on the admin session.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}
