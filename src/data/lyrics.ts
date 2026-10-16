import type { Lyrics } from "@/lib/types";

/**
 * Optional lyrics bundled with the site, keyed by track key ("<album id>-<n>", e.g. "met-13").
 * Linkin Park's lyrics are copyrighted, so the repository ships none. Visitors add their own
 * with "Agregar letra" or by importing a .txt file; those are kept in their browser.
 */
export const userLyrics: Record<string, Lyrics> = {};
