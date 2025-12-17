import { AppConfig } from "./types";

let cachedConfig: AppConfig | null = null;

/**
 * Load config - works both client and server side
 */
export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Server-side: read from filesystem
  if (typeof window === "undefined") {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const configPath = join(process.cwd(), "public", "config.json");
    const configData = readFileSync(configPath, "utf-8");
    cachedConfig = JSON.parse(configData);
    return cachedConfig!;
  }

  // Client-side: fetch from public
  const res = await fetch("/config.json", { cache: "no-store" });
  
  if (!res.ok) {
    throw new Error("Failed to load config.json");
  }
  
  cachedConfig = await res.json();
  return cachedConfig!;
}

/**
 * Get config synchronously (for client components that have already loaded it)
 */
export function getConfig(): AppConfig | null {
  return cachedConfig;
}

/**
 * Create a seeded random number generator for deterministic shuffling
 */
export function createSeededRandom(seed: string): () => number {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Linear congruential generator
  let state = Math.abs(hash);
  
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Shuffle array using Fisher-Yates algorithm with optional seeded RNG
 */
export function shuffleArray<T>(array: T[], rng?: () => number): T[] {
  const shuffled = [...array];
  const random = rng || Math.random;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}
