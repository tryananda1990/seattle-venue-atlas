-- Admin-entered venues (via the AI import tool) won't have coordinates until
-- the map view work adds geocoding. Relax the constraint now so venue
-- creation isn't blocked on a feature that's deferred to a later phase;
-- backfill before the map view ships.

alter table venues alter column location drop not null;
