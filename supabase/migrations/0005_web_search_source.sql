-- New provenance value for venues enriched via a general web search rather
-- than their own website (they have none) -- lets data-quality queries
-- distinguish "found via the venue's own site" from "found via a search
-- result about the venue elsewhere."

alter type venue_source add value 'web_search';
