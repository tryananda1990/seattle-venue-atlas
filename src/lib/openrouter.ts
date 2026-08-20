import OpenAI from "openai";

// No `import "server-only"` here: this module is also imported by
// scripts/discover.ts, run via plain Node (tsx), where that marker throws
// unconditionally. Never import this file from a Client Component.

/**
 * OpenRouter is OpenAI-API-compatible, so the official `openai` SDK works
 * unmodified — just point it at OpenRouter's base URL. Used server-side only
 * (admin import tool, PRD §6.2); never expose OPENROUTER_API_KEY to the browser.
 */
export function createOpenRouterClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      "AI enrichment is paused — OPENROUTER_API_KEY isn't set. Add it back to .env.local (and Vercel) to resume."
    );
  }

  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": "Seattle Venue Atlas",
    },
  });
}
