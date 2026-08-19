-- Sample data for local development only. These are fictional placeholder
-- venues used to exercise the list/filter/detail UI end to end — not real
-- venues. Replace with real, admin-verified entries before going live.

insert into venues (
  name, slug, category, city, address, location,
  capacity_min, capacity_max,
  sound_system, sound_system_notes,
  rental_fee_amount, rental_fee_unit, rental_fee_notes,
  production_notes, amenities,
  reservation_url, contact_email, contact_form_url, phone, website_url,
  description,
  source, verification_status, last_verified_at
) values
(
  'Sample Community Hall', 'sample-community-hall-seattle', 'community_hall', 'seattle',
  '123 Placeholder St, Seattle, WA', ST_GeogFromText('POINT(-122.3321 47.6062)'),
  50, 150,
  'extra_fee', 'Basic PA available for an additional $50/event.',
  75, 'hour', 'Two-hour minimum.',
  null, array['Parking', 'Kitchen access', 'ADA accessible'],
  'https://example.com/reserve/sample-community-hall', null, null, '(206) 555-0101', 'https://example.com',
  'A flexible multi-purpose hall for community meetings, small recitals, and private events.',
  'manual', 'verified', now() - interval '2 months'
),
(
  'Sample Performing Arts Center', 'sample-pac-bellevue', 'school_pac', 'bellevue',
  '456 Placeholder Ave, Bellevue, WA', ST_GeogFromText('POINT(-122.2015 47.6101)'),
  300, 500,
  'included', 'Full house PA, wireless mics, and stage lighting included.',
  null, 'unknown', 'Nonprofit and school discounts available — contact for a quote.',
  'Loading dock at rear of building. Backline (drum kit, amps) available on request.',
  array['Stage', 'Green room', 'Loading dock', 'Projector/screen', 'ADA accessible'],
  null, 'reservations@example.com', null, '(425) 555-0102', 'https://example.com',
  'A 400-seat proscenium theatre used for school productions, recitals, and community performances.',
  'manual', 'verified', now() - interval '1 month'
),
(
  'Sample Repertory Theatre', 'sample-repertory-theatre-tacoma', 'theatre', 'tacoma',
  '789 Placeholder Blvd, Tacoma, WA', ST_GeogFromText('POINT(-122.4443 47.2529)'),
  700, 850,
  'included', 'In-house sound engineer available for an additional fee.',
  1200, 'event', null,
  'Fly system, orchestra pit, and loading dock. Backline not provided — touring acts should bring their own.',
  array['Stage', 'Green room', 'Loading dock', 'Parking'],
  null, null, 'https://example.com/contact-sample-theatre', '(253) 555-0103', 'https://example.com',
  'A mid-sized proscenium theatre hosting touring productions, concerts, and community theatre.',
  'manual', 'verified', now() - interval '3 months'
),
(
  'Sample Outdoor Amphitheater', 'sample-amphitheater-redmond', 'outdoor_amphitheater', 'redmond',
  '321 Placeholder Way, Redmond, WA', ST_GeogFromText('POINT(-122.1215 47.6740)'),
  1000, 2000,
  'none', 'No house sound — bring your own PA or rent from a third party.',
  null, 'unknown', null,
  'Grass amphitheater, no covered stage. Power available at two locations near the stage.',
  array['Parking'],
  null, null, null, '(425) 555-0104', 'https://example.com',
  'An outdoor amphitheater used for summer concerts and community festivals.',
  'manual', 'verified', now() - interval '5 months'
),
(
  'Sample Event Center', 'sample-event-center-kirkland', 'event_center', 'kirkland',
  '654 Placeholder Rd, Kirkland, WA', ST_GeogFromText('POINT(-122.2087 47.6769)'),
  100, 300,
  'extra_fee', 'PA and mixer rental available for $150/day.',
  300, 'day', null,
  null, array['Parking', 'Kitchen access', 'Wi-Fi', 'ADA accessible'],
  'https://example.com/reserve/sample-event-center', 'events@example.com', null, '(425) 555-0105', 'https://example.com',
  'A conference and banquet space that also hosts smaller concerts and screenings.',
  'manual', 'verified', now() - interval '2 weeks'
);
