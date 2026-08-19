import * as cheerio from "cheerio";
import { z } from "zod";
import { createOpenRouterClient } from "@/lib/openrouter";

// No `import "server-only"` here: this module is also imported by
// scripts/discover.ts, run via plain Node (tsx), where that marker throws
// unconditionally. Never import this file from a Client Component.

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

You may receive text from more than one page of the same website, each preceded by a "--- Page: <url> ---" marker. Combine information across all of them.

Return strictly the JSON object described by the schema, with these exact keys: name, category_guess, city_guess, address, capacity_min, capacity_max, sound_system, sound_system_notes, rental_fee_amount, rental_fee_unit, rental_fee_notes, production_notes, amenities, reservation_url, contact_email, contact_form_url, phone, description.

category_guess must be one of: school_pac, theatre, community_hall, church_hall, event_center, outdoor_amphitheater, university_auditorium, cultural_center — or null if unclear.
city_guess must be one of: seattle, bellevue, redmond, kirkland, renton, tacoma, everett, bothell, kent, federal_way, shoreline, edmonds, issaquah, mercer_island, lynnwood — inferred from the venue's address if present, or null if you can't tell.
sound_system must be one of: included, extra_fee, none, unknown (unknown if not mentioned).
rental_fee_unit must be one of: hour, day, event, unknown.
production_notes should cover load-in/loading dock access, power/electrical, and backline availability, when the page mentions any of these — these matter to bands and concert promoters deciding whether the venue can host a show.
amenities is a short array of tags like "Parking", "Stage", "Green room", "Loading dock", "Kitchen access", "ADA accessible", "Wi-Fi" — only include ones the text actually supports.`;

/**
 * Claude models sometimes wrap JSON-mode output in a markdown code fence even
 * when asked for raw JSON — strip it before parsing.
 */
function stripCodeFence(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenceMatch ? fenceMatch[1] : text;
}

const RENTAL_LINK_KEYWORDS = [
  "rent",
  "rental",
  "book",
  "booking",
  "reserve",
  "reservation",
  "event",
  "wedding",
  "facility",
  "hire",
  "meeting space",
  "host your",
  "plan your event",
  "private event",
];

const MAX_SUBPAGES = 2;
const MAX_CHARS_PER_PAGE = 9_000;

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "SeattleVenueAtlas-Import/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Fetching the page failed (HTTP ${response.status}).`);
  }
  return response.text();
}

function extractBodyText($: ReturnType<typeof cheerio.load>, maxChars: number): string {
  $("script, style, noscript, svg, nav, footer").remove();
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, maxChars);
}

/**
 * Finds same-origin links likely to lead to a rentals/events/facility-hire
 * page — these usually carry the capacity/fee/sound-system specifics that
 * never show up on a homepage. Searches the full document (nav/footer
 * included), since that's exactly where these links tend to live.
 */
function findCandidateSubpageUrls(
  $: ReturnType<typeof cheerio.load>,
  baseUrl: string,
  limit: number
): string[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>([base.toString()]);
  const candidates: { url: string; score: number }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) return;

    let resolved: URL;
    try {
      resolved = new URL(href, base);
    } catch {
      return;
    }
    if (resolved.hostname !== base.hostname) return;

    const absolute = resolved.toString();
    if (seen.has(absolute)) return;

    const haystack = `${$(el).text()} ${href}`.toLowerCase();
    const score = RENTAL_LINK_KEYWORDS.filter((kw) => haystack.includes(kw)).length;
    if (score > 0) {
      seen.add(absolute);
      candidates.push({ url: absolute, score });
    }
  });

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.url);
}

export async function extractVenueFromUrl(url: string): Promise<VenueExtraction> {
  const mainHtml = await fetchHtml(url);
  const main$ = cheerio.load(mainHtml);
  const subpageUrls = findCandidateSubpageUrls(main$, url, MAX_SUBPAGES);
  const mainText = extractBodyText(main$, MAX_CHARS_PER_PAGE);

  const pages = [{ url, text: mainText }];
  for (const subUrl of subpageUrls) {
    try {
      const subHtml = await fetchHtml(subUrl);
      const subText = extractBodyText(cheerio.load(subHtml), MAX_CHARS_PER_PAGE);
      if (subText) pages.push({ url: subUrl, text: subText });
    } catch {
      // Best-effort — a subpage that fails to fetch just gets skipped.
    }
  }

  const combinedText = pages.map((p) => `--- Page: ${p.url} ---\n${p.text}`).join("\n\n");
  if (!pages.some((p) => p.text)) throw new Error("The page had no readable text content.");

  const client = createOpenRouterClient();
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: combinedText },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("The model returned an empty response.");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new Error("The model didn't return valid JSON.");
  }

  const result = VenueExtractionSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error(`The model's response didn't match the expected shape: ${result.error.message}`);
  }

  return result.data;
}
