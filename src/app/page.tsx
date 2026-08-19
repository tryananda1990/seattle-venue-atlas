import { FilterBar } from "@/components/FilterBar";
import { VenueRow } from "@/components/VenueRow";
import { parseFilters } from "@/lib/parse-filters";
import { getVenues } from "@/lib/venues";

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default async function Home({ searchParams }: PageProps<"/">) {
  if (!isSupabaseConfigured) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted max-w-md text-center">
          Add Supabase credentials to .env.local to start loading venues.
        </p>
      </main>
    );
  }

  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const venues = await getVenues(filters);

  return (
    <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
      <aside>
        <h1 className="text-lg font-semibold mb-1">Seattle Venue Atlas</h1>
        <p className="text-sm text-muted mb-6">
          Auditoriums, theatres, and halls across Greater Seattle.
        </p>
        <FilterBar filters={filters} />
      </aside>

      <section>
        <p className="text-sm text-muted mb-4">
          {venues.length} {venues.length === 1 ? "venue" : "venues"}
        </p>
        {venues.length === 0 ? (
          <p className="text-muted text-sm border border-dashed border-line rounded-lg px-5 py-8 text-center">
            No venues match those filters yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {venues.map((venue) => (
              <VenueRow key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
