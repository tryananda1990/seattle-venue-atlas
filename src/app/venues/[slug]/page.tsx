import Link from "next/link";
import { notFound } from "next/navigation";
import { VENUE_CATEGORY_LABELS, VENUE_CITY_LABELS, resolveVenueAction } from "@/types/venue";
import { formatCapacity, formatRentalFee, getVenueBySlug } from "@/lib/venues";

const SOUND_LABEL: Record<string, string> = {
  included: "Included",
  extra_fee: "Available for extra fee",
  none: "Not available",
  unknown: "Unknown",
};

export default async function VenuePage({ params }: PageProps<"/venues/[slug]">) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();

  const action = resolveVenueAction(venue);
  const lastVerified = venue.last_verified_at
    ? new Date(venue.last_verified_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-accent">
        ← All venues
      </Link>

      <div className="mt-4 mb-1 flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-accent font-medium">
          {VENUE_CATEGORY_LABELS[venue.category]}
        </span>
        <span className="text-xs text-muted">· {VENUE_CITY_LABELS[venue.city]}</span>
      </div>
      <h1 className="text-2xl font-semibold">{venue.name}</h1>
      <p className="text-sm text-muted mt-1">{venue.address}</p>

      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm border-t border-line pt-6">
        <div>
          <dt className="text-muted mb-1">Capacity</dt>
          <dd>{formatCapacity(venue.capacity_min, venue.capacity_max)}</dd>
        </div>
        <div>
          <dt className="text-muted mb-1">Rental fee</dt>
          <dd>{formatRentalFee(venue.rental_fee_amount, venue.rental_fee_unit)}</dd>
        </div>
        <div>
          <dt className="text-muted mb-1">Sound system</dt>
          <dd>{SOUND_LABEL[venue.sound_system]}</dd>
        </div>
        {venue.phone && (
          <div>
            <dt className="text-muted mb-1">Phone</dt>
            <dd>{venue.phone}</dd>
          </div>
        )}
      </dl>

      {venue.sound_system_notes && (
        <p className="mt-4 text-sm text-muted">{venue.sound_system_notes}</p>
      )}

      {venue.description && (
        <p className="mt-6 text-sm leading-relaxed">{venue.description}</p>
      )}

      {venue.production_notes && (
        <div className="mt-6 border-t border-line pt-6">
          <h2 className="text-xs uppercase tracking-wide text-muted mb-2">
            For bands &amp; promoters
          </h2>
          <p className="text-sm leading-relaxed">{venue.production_notes}</p>
        </div>
      )}

      {venue.amenities.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {venue.amenities.map((amenity) => (
            <span
              key={amenity}
              className="text-xs bg-accent-soft text-accent px-2.5 py-1 rounded-full"
            >
              {amenity}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-line pt-6 flex items-center justify-between gap-4">
        <div>
          {action.kind === "unavailable" ? (
            <button
              disabled
              className="rounded bg-line text-muted text-sm font-medium px-5 py-2.5 cursor-not-allowed"
            >
              {action.label}
            </button>
          ) : (
            <a
              href={action.href}
              target={action.kind === "email" ? undefined : "_blank"}
              rel={action.kind === "email" ? undefined : "noopener noreferrer"}
              className="inline-block rounded bg-accent text-white text-sm font-medium px-5 py-2.5 hover:opacity-90"
            >
              {action.label}
            </a>
          )}
          {action.kind === "unavailable" && (venue.phone || venue.website_url) && (
            <p className="text-xs text-muted mt-2">
              {venue.phone}
              {venue.phone && venue.website_url && " · "}
              {venue.website_url && (
                <a href={venue.website_url} target="_blank" rel="noopener noreferrer" className="underline">
                  {venue.website_url}
                </a>
              )}
            </p>
          )}
        </div>
        {lastVerified && (
          <p className="text-xs text-muted whitespace-nowrap">Last verified {lastVerified}</p>
        )}
      </div>
    </main>
  );
}
