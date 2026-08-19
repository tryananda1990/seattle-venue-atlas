import Link from "next/link";
import { VENUE_CATEGORY_LABELS, VENUE_CITY_LABELS, type Venue } from "@/types/venue";
import { formatCapacity, formatRentalFee } from "@/lib/venues";

const SOUND_LABEL: Record<Venue["sound_system"], string> = {
  included: "Sound system included",
  extra_fee: "Sound system available (fee)",
  none: "No sound system",
  unknown: "Sound system unknown",
};

export function VenueRow({ venue }: { venue: Venue }) {
  return (
    <Link
      href={`/venues/${venue.slug}`}
      className="flex items-center justify-between gap-6 rounded-lg border border-line bg-surface px-5 py-4 hover:border-accent transition-colors"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase tracking-wide text-accent font-medium">
            {VENUE_CATEGORY_LABELS[venue.category]}
          </span>
          <span className="text-xs text-muted">· {VENUE_CITY_LABELS[venue.city]}</span>
        </div>
        <h2 className="font-semibold text-foreground truncate">{venue.name}</h2>
        <p className="text-sm text-muted mt-0.5">
          {formatCapacity(venue.capacity_min, venue.capacity_max)} · {SOUND_LABEL[venue.sound_system]}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-medium text-foreground">
          {formatRentalFee(venue.rental_fee_amount, venue.rental_fee_unit)}
        </div>
      </div>
    </Link>
  );
}
