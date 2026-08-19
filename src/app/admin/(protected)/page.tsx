import Link from "next/link";
import { VENUE_CATEGORY_LABELS, VENUE_CITY_LABELS } from "@/types/venue";
import { listAllVenuesForAdmin } from "@/lib/admin-venues";

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-accent-soft text-accent",
  needs_review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  unpublished: "bg-line text-muted",
};

const STATUS_LABELS: Record<string, string> = {
  verified: "Verified",
  needs_review: "Needs review",
  unpublished: "Unpublished",
};

export default async function AdminDashboardPage() {
  const venues = await listAllVenuesForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Venues ({venues.length})</h1>
        <Link
          href="/admin/import"
          className="rounded bg-accent text-white text-sm font-medium px-4 py-2 hover:opacity-90"
        >
          Import venue
        </Link>
      </div>

      {venues.length === 0 ? (
        <p className="text-sm text-muted border border-dashed border-line rounded-lg px-5 py-8 text-center">
          No venues yet — start by importing one.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{venue.name}</div>
                <div className="text-xs text-muted">
                  {VENUE_CATEGORY_LABELS[venue.category]} · {VENUE_CITY_LABELS[venue.city]}
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[venue.verification_status]}`}
              >
                {STATUS_LABELS[venue.verification_status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
