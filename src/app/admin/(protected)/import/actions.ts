"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractVenueFromUrl, type VenueExtraction } from "@/lib/venue-extraction";
import { slugify } from "@/lib/slugify";

async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/admin/login");
  }
}

export interface ExtractState {
  data: VenueExtraction | null;
  sourceUrl: string;
  error: string | null;
}

export async function extractVenueData(
  _prevState: ExtractState,
  formData: FormData
): Promise<ExtractState> {
  await requireAdminSession();

  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    return { data: null, sourceUrl: "", error: "Enter a URL to extract from." };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { data: null, sourceUrl: url, error: "URL must be http or https." };
    }
  } catch {
    return { data: null, sourceUrl: url, error: "That doesn't look like a valid URL." };
  }

  try {
    const data = await extractVenueFromUrl(url);
    return { data, sourceUrl: url, error: null };
  } catch (err) {
    return {
      data: null,
      sourceUrl: url,
      error: err instanceof Error ? err.message : "Extraction failed.",
    };
  }
}

function optionalString(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function optionalNumber(formData: FormData, key: string): number | null {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export async function publishVenue(formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const city = String(formData.get("city") ?? "");
  const address = String(formData.get("address") ?? "").trim();

  if (!name || !category || !city || !address) {
    redirect(
      `/admin/import?publishError=${encodeURIComponent("Name, category, city, and address are required.")}`
    );
  }

  const supabase = createAdminClient();

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;
  for (let tries = 0; tries < 20; tries++) {
    const { data: existing } = await supabase.from("venues").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const publishNow = formData.get("verification_status") === "verified";

  const { error } = await supabase.from("venues").insert({
    name,
    slug,
    category,
    city,
    address,
    capacity_min: optionalNumber(formData, "capacity_min"),
    capacity_max: optionalNumber(formData, "capacity_max"),
    sound_system: String(formData.get("sound_system") ?? "unknown"),
    sound_system_notes: optionalString(formData, "sound_system_notes"),
    rental_fee_amount: optionalNumber(formData, "rental_fee_amount"),
    rental_fee_unit: String(formData.get("rental_fee_unit") ?? "unknown"),
    rental_fee_notes: optionalString(formData, "rental_fee_notes"),
    production_notes: optionalString(formData, "production_notes"),
    amenities: optionalString(formData, "amenities")
      ?.split(",")
      .map((a) => a.trim())
      .filter(Boolean) ?? [],
    reservation_url: optionalString(formData, "reservation_url"),
    contact_email: optionalString(formData, "contact_email"),
    contact_form_url: optionalString(formData, "contact_form_url"),
    phone: optionalString(formData, "phone"),
    website_url: optionalString(formData, "website_url"),
    description: optionalString(formData, "description"),
    source: "ai_extracted",
    verification_status: publishNow ? "verified" : "needs_review",
    last_verified_at: publishNow ? new Date().toISOString() : null,
  });

  if (error) {
    redirect(`/admin/import?publishError=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin?imported=1");
}
