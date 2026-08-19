-- Generated columns so latitude/longitude can be selected directly via
-- PostgREST for the map view, instead of parsing the geography column
-- client-side. Backed by the existing `location` column, so nothing to
-- backfill -- these compute automatically from what's already there.

alter table venues
  add column latitude double precision generated always as (ST_Y(location::geometry)) stored,
  add column longitude double precision generated always as (ST_X(location::geometry)) stored;
