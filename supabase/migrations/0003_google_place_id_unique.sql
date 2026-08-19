-- Lets scripts/discover.ts upsert on google_place_id, so re-running the
-- discovery sweep updates existing rows instead of creating duplicates.

create unique index venues_google_place_id_key on venues (google_place_id)
  where google_place_id is not null;
