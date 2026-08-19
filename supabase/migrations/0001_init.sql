-- Seattle Venue Atlas — initial schema
-- Matches the data model in the PRD (§5) plus the concert-booking fields added in review.

create extension if not exists postgis;

create type venue_category as enum (
  'school_pac',
  'theatre',
  'community_hall',
  'church_hall',
  'event_center',
  'outdoor_amphitheater',
  'university_auditorium',
  'cultural_center'
);

create type venue_city as enum (
  'seattle',
  'bellevue',
  'redmond',
  'kirkland',
  'renton',
  'tacoma',
  'everett',
  'bothell',
  'kent',
  'federal_way',
  'shoreline',
  'edmonds',
  'issaquah',
  'mercer_island',
  'lynnwood'
);

create type sound_system_status as enum (
  'included',
  'extra_fee',
  'none',
  'unknown'
);

create type rental_fee_unit as enum (
  'hour',
  'day',
  'event',
  'unknown'
);

create type venue_source as enum (
  'manual',
  'ai_extracted',
  'google_places'
);

create type venue_verification_status as enum (
  'verified',
  'needs_review',
  'unpublished'
);

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category venue_category not null,
  city venue_city not null,
  address text not null,
  location geography(point, 4326) not null,

  capacity_min int,
  capacity_max int,

  sound_system sound_system_status not null default 'unknown',
  sound_system_notes text,

  rental_fee_amount numeric,
  rental_fee_unit rental_fee_unit not null default 'unknown',
  rental_fee_notes text,

  production_notes text,
  amenities text[] not null default '{}',
  photos text[] not null default '{}',

  reservation_url text,
  contact_email text,
  contact_form_url text,
  phone text,
  website_url text,

  description text,

  source venue_source not null default 'manual',
  google_place_id text,
  verification_status venue_verification_status not null default 'needs_review',
  last_verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint capacity_range_valid check (
    capacity_min is null or capacity_max is null or capacity_min <= capacity_max
  )
);

create index venues_location_idx on venues using gist (location);
create index venues_category_idx on venues (category);
create index venues_city_idx on venues (city);
create index venues_verification_status_idx on venues (verification_status);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger venues_set_updated_at
  before update on venues
  for each row
  execute function set_updated_at();

alter table venues enable row level security;

-- Public (anon) role: read-only access to verified venues.
create policy "Public can read verified venues"
  on venues for select
  to anon
  using (verification_status = 'verified');

-- Authenticated (admin) role: full access.
-- v1 has a single admin user, so any authenticated user is treated as admin.
create policy "Authenticated users can manage venues"
  on venues for all
  to authenticated
  using (true)
  with check (true);
