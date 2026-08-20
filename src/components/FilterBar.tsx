import Link from "next/link";
import { VENUE_CATEGORY_LABELS, VENUE_CITY_LABELS } from "@/types/venue";
import type { VenueFilters } from "@/lib/venues";

// "unknown" isn't offered as a checkbox — venues with an unconfirmed sound
// system always pass this filter regardless of selection (see getVenues),
// so a checkbox for it would look selectable without ever changing results.
const SOUND_SYSTEM_OPTIONS: { value: string; label: string }[] = [
  { value: "included", label: "Included" },
  { value: "extra_fee", label: "Available for extra fee" },
  { value: "none", label: "Not available" },
];

function CheckboxGroup({
  name,
  legend,
  options,
  selected,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string }[];
  selected: string[];
}) {
  return (
    <fieldset className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <legend className="text-xs font-medium uppercase tracking-wide text-muted mb-2">
        {legend}
      </legend>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              value={opt.value}
              defaultChecked={selected.includes(opt.value)}
              className="accent-[var(--accent)]"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FilterBar({
  filters,
  view,
}: {
  filters: VenueFilters;
  view?: "list" | "map";
}) {
  const categoryOptions = Object.entries(VENUE_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const cityOptions = Object.entries(VENUE_CITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <form method="get" action="/" className="flex flex-col gap-4 text-foreground">
      {view && <input type="hidden" name="view" value={view} />}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-muted">Search</span>
        <input
          type="search"
          name="q"
          defaultValue={filters.search ?? ""}
          placeholder="Venue name or city"
          className="rounded border border-line bg-surface px-3 py-2"
        />
      </label>

      <CheckboxGroup
        name="category"
        legend="Category"
        options={categoryOptions}
        selected={filters.category ?? []}
      />
      <CheckboxGroup
        name="city"
        legend="City"
        options={cityOptions}
        selected={filters.city ?? []}
      />
      <CheckboxGroup
        name="sound"
        legend="Sound system"
        options={SOUND_SYSTEM_OPTIONS}
        selected={filters.soundSystem ?? []}
      />

      <fieldset className="border-t border-line pt-4">
        <legend className="text-xs font-medium uppercase tracking-wide text-muted mb-2">
          Capacity
        </legend>
        <label className="flex items-center gap-2 text-sm">
          At least
          <input
            type="number"
            name="min_capacity"
            min={0}
            defaultValue={filters.minCapacity ?? ""}
            placeholder="e.g. 200"
            className="w-24 rounded border border-line bg-surface px-2 py-1"
          />
          people
        </label>
      </fieldset>

      <fieldset className="border-t border-line pt-4">
        <legend className="text-xs font-medium uppercase tracking-wide text-muted mb-2">
          Rental fee
        </legend>
        <label className="flex items-center gap-2 text-sm mb-2">
          Up to $
          <input
            type="number"
            name="max_fee"
            min={0}
            defaultValue={filters.maxFee ?? ""}
            placeholder="e.g. 500"
            className="w-24 rounded border border-line bg-surface px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="priced_only"
            value="1"
            defaultChecked={filters.publishedPricingOnly}
            className="accent-[var(--accent)]"
          />
          Only show published pricing
        </label>
      </fieldset>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 rounded bg-accent text-white text-sm font-medium py-2 hover:opacity-90"
        >
          Apply filters
        </button>
        <Link
          href={view ? `/?view=${view}` : "/"}
          className="text-sm text-muted underline underline-offset-2 self-center"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
