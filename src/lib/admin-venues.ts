import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Venue } from "@/types/venue";

/** Lists every venue regardless of verification status — admin-only. */
export async function listAllVenuesForAdmin(): Promise<
  Pick<Venue, "id" | "name" | "slug" | "city" | "category" | "verification_status" | "last_verified_at">[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, slug, city, category, verification_status, last_verified_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load venues: ${error.message}`);
  return data ?? [];
}
