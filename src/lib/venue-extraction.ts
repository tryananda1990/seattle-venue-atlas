import "server-only";
import * as cheerio from "cheerio";
import { z } from "zod";
import { createOpenRouterClient } from "@/lib/openrouter";

export const VenueExtractionSchema = z.object({
  name: z.string().nullable(),
  category_guess: z
    .enum([
      "school_pac",
      "theatre",
      "community_hall",
      "church_hall",
      "event_center",
      "outdoor_amphitheater",
      "university_auditorium",
      "cultural_center",
    ])
    .nullable(),
  city_guess: z
    .enum([
      "seattle",
      "bellevue",
      "redmond",
      "kirkland",
      "renton",
      "tacoma",
      "everett",
      "bothell",
      "kent",
      "federal_way",
      "shoreline",
      "edmonds",
      "issaquah",
      "mercer_island",
      "lynnwood",
    ])
    .nullable(),
  address: z.string().nullable(),
  capacity_min: z.number().int().positive().nullable(),
  capacity_max: z.number().int().positive().nullable(),
  sound_system: z.enum(["included", "extra_fee", "none", "unknown"]).nullable(),
  sound_system_notes: z.string().nullable(),
  rental_fee_amount: z.number().positive().nullable(),
  rental_fee_unit: z.enum(["hour", "day", "event", "unknown"]).nullable(),
  rental_fee_notes: z.string().nullable(),
  production_notes: z.string().nullable(),
  amenities: z.array(z.string()).nullable(),
  reservation_url: z.string().nullable(),
  contact_email: z.string().nullable(),
  contact_form_url: z.string().nullable(),
  phone: z.string().nullable(),
  description: z.string().nullable(),
});

export type VenueExtraction = z.infer<typeof VenueExtractionSchema>;

const EXTRACTION_SYSTEM_PROMPT = `You extract structured venue-rental information from a performance/event venue's website text, for an admin who will review every field before publishing.

Only report what the page text actually states. If a field isn't mentioned, set it to null — never guess or estimate.

Return strictly the JSON object described by the schema, with these exact keys: name, category_guess, city_guess, address, capacity_min, capacity_max, sound_system, sound_system_notes, rental_fee_amount, rental_fee_unit, rental_fee_notes, production_notes, amenities, reservation_url, contact_email, contact_form_url, phone, description.

category_guess must be one of: school_pac, theatre, community_hall, church_hall, event_center, outdoor_amphitheater, university_auditorium, cultural_center — or null if unclear.
city_guess must be one of: seattle, bellevue, redmond, kirkland, renton, tacoma, everett, bothell, kent, federal_way, shoreline, edmonds, issaquah, mercer_island, lynnwood — inferred from the venue's address if present, or null if you can't tell.
sound_system must be one of: included, extra_fee, none, unknown (unknown if not mentioned).
rental_fee_unit must be one of: hour, day, event, unknown.
production_notes should cover load-in/loading dock access, power/electrical, and backline availability, when the page mentions any of these — these matter to bands and concert promoters deciding whether the venue can host a show.
amenities is a short array of tags like "Parking", "Stage", "Green room", "Loading dock", "Kitchen access", "ADA accessible", "Wi-Fi" — only include ones the text actually supports.`;

async function fetchPageText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "SeattleVenueAtlas-Import/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Fetching the page failed (HTTP ${response.status}).`);
  }
  const html = await response.text();

  const $ = cheerio.load(html);
  $("script, style, noscript, svg, nav, footer").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();

  if (!text) throw new Error("The page had no readable text content.");
  return text.slice(0, 20_000);
}

export async function extractVenueFromUrl(url: string): Promise<VenueExtraction> {
  const pageText = await fetchPageText(url);

  const client = createOpenRouterClient();
  const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-haiku-4.5";

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: pageText },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("The model returned an empty response.");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error("The model didn't return valid JSON.");
  }

  const result = VenueExtractionSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error(`The model's response didn't match the expected shape: ${result.error.message}`);
  }

  return result.data;
}
