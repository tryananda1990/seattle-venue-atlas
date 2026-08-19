# Seattle Venue Atlas

A searchable directory and map of rentable auditoriums, theatres, and halls across the Greater Seattle area. See the product requirements doc for full scope.

## Stack

- **Frontend/backend:** Next.js 16 (App Router, TypeScript, Tailwind)
- **Database:** Supabase (Postgres + PostGIS), via `@supabase/supabase-js` / `@supabase/ssr`
- **Map:** Mapbox GL JS (`mapbox-gl`, `react-map-gl`)
- **AI:** OpenRouter, via the OpenAI SDK pointed at OpenRouter's API
- **Hosting:** Vercel

## Setup

1. Copy the env template and fill in credentials (see below):

   ```bash
   cp .env.local.example .env.local
   ```

2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Apply the database schema in `supabase/migrations/0001_init.sql` to your Supabase project (via the SQL editor, or the Supabase CLI once linked).

## Environment variables

See `.env.local.example` for the full list. In short:

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Supabase project → Settings → API Keys (new publishable/secret key format, not the legacy anon/service_role keys) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | account.mapbox.com/access-tokens |
| `OPENROUTER_API_KEY` | openrouter.ai/keys |
| `GOOGLE_PLACES_API_KEY` | Google Cloud Console (Places API enabled) |

## Deployment

Deploys to Vercel from this repo. Set the same environment variables in the Vercel project settings (Production + Preview).
