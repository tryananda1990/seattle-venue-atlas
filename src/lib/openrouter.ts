import "server-only";
import OpenAI from "openai";

/**
 * OpenRouter is OpenAI-API-compatible, so the official `openai` SDK works
 * unmodified — just point it at OpenRouter's base URL. Used server-side only
 * (admin import tool, PRD §6.2); never expose OPENROUTER_API_KEY to the browser.
 */
export function createOpenRouterClient() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": "Seattle Venue Atlas",
    },
  });
}
