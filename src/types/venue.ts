export type VenueCategory =
  | "school_pac"
  | "theatre"
  | "community_hall"
  | "church_hall"
  | "event_center"
  | "outdoor_amphitheater"
  | "university_auditorium"
  | "cultural_center";

export type VenueCity =
  | "seattle"
  | "bellevue"
  | "redmond"
  | "kirkland"
  | "renton"
  | "tacoma"
  | "everett"
  | "bothell"
  | "kent"
  | "federal_way"
  | "shoreline"
  | "edmonds"
  | "issaquah"
  | "mercer_island"
  | "lynnwood";

export type SoundSystemStatus = "included" | "extra_fee" | "none" | "unknown";

export type RentalFeeUnit = "hour" | "day" | "event" | "unknown";

export type VenueSource = "manual" | "ai_extracted" | "google_places";

export type VenueVerificationStatus = "verified" | "needs_review" | "unpublished";

export interface Venue {
  id: string;
  name: string;
  slug: string;
  category: VenueCategory;
  city: VenueCity;
  address: string;
  latitude: number;
  longitude: number;

  capacity_min: number | null;
  capacity_max: number | null;

  sound_system: SoundSystemStatus;
  sound_system_notes: string | null;

  rental_fee_amount: number | null;
  rental_fee_unit: RentalFeeUnit;
  rental_fee_notes: string | null;

  production_notes: string | null;
  amenities: string[];
  photos: string[];

  reservation_url: string | null;
  contact_email: string | null;
  contact_form_url: string | null;
  phone: string | null;
  website_url: string | null;

  description: string | null;

  source: VenueSource;
  google_place_id: string | null;
  verification_status: VenueVerificationStatus;
  last_verified_at: string | null;

  created_at: string;
  updated_at: string;
}

export const VENUE_CATEGORY_LABELS: Record<VenueCategory, string> = {
  school_pac: "School PAC",
  theatre: "Theatre",
  community_hall: "Community / Civic Hall",
  church_hall: "Church / Religious Hall",
  event_center: "Conference & Event Center",
  outdoor_amphitheater: "Outdoor Amphitheater",
  university_auditorium: "University / College Auditorium",
  cultural_center: "Cultural Center",
};

export const VENUE_CITY_LABELS: Record<VenueCity, string> = {
  seattle: "Seattle",
  bellevue: "Bellevue",
  redmond: "Redmond",
  kirkland: "Kirkland",
  renton: "Renton",
  tacoma: "Tacoma",
  everett: "Everett",
  bothell: "Bothell",
  kent: "Kent",
  federal_way: "Federal Way",
  shoreline: "Shoreline",
  edmonds: "Edmonds",
  issaquah: "Issaquah",
  mercer_island: "Mercer Island",
  lynnwood: "Lynnwood",
};

/**
 * Resolves the venue detail page's single primary action, per PRD §4.5.
 * Priority: reservation page -> email -> contact form -> disabled fallback.
 */
export type VenueAction =
  | { kind: "reservation"; label: "Check availability"; href: string }
  | { kind: "email"; label: "Request reservation info"; href: string }
  | { kind: "contact_form"; label: "Contact venue"; href: string }
  | { kind: "unavailable"; label: "Contact venue directly" };

export function resolveVenueAction(venue: Venue): VenueAction {
  if (venue.reservation_url) {
    return { kind: "reservation", label: "Check availability", href: venue.reservation_url };
  }
  if (venue.contact_email) {
    const subject = encodeURIComponent(`Reservation inquiry — ${venue.name}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'm interested in reserving ${venue.name} for an event.\n\nEvent type: \nDate(s): \nExpected attendance: \n\nCould you send me availability and reservation details?\n\nThanks!`
    );
    return {
      kind: "email",
      label: "Request reservation info",
      href: `mailto:${venue.contact_email}?subject=${subject}&body=${body}`,
    };
  }
  if (venue.contact_form_url) {
    return { kind: "contact_form", label: "Contact venue", href: venue.contact_form_url };
  }
  return { kind: "unavailable", label: "Contact venue directly" };
}
