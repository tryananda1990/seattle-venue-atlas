import type { VenueFilters } from "@/lib/venues";
import type { SoundSystemStatus, VenueCategory, VenueCity } from "@/types/venue";

type SearchParams = Record<string, string | string[] | undefined>;

function splitParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw.split(",").filter(Boolean);
}

export function parseFilters(searchParams: SearchParams): VenueFilters {
  const minCapacity = Number(searchParams.min_capacity);
  const maxFee = Number(searchParams.max_fee);

  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  return {
    search: q.length > 0 ? q : undefined,
    city: splitParam(searchParams.city) as VenueCity[],
    category: splitParam(searchParams.category) as VenueCategory[],
    soundSystem: splitParam(searchParams.sound) as SoundSystemStatus[],
    minCapacity: Number.isFinite(minCapacity) && minCapacity > 0 ? minCapacity : undefined,
    maxFee: Number.isFinite(maxFee) && maxFee > 0 ? maxFee : undefined,
    publishedPricingOnly: searchParams.priced_only === "1",
  };
}
