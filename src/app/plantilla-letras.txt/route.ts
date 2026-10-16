import { albums } from "@/lib/albums";
import { lyricsTemplate } from "@/lib/importLyrics";

export const dynamic = "force-static";

/** Downloadable template with every song, ready to fill in and import. */
export function GET() {
  return new Response(lyricsTemplate(albums), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
