import type { Lyrics, Track } from "./types";

/**
 * Lyrics file format (plain .txt):
 *   ## Song title        (or the track key, e.g. "## met-13")
 *   original lines...
 *   ---
 *   translated lines...
 * Lines starting with "# " (a single hash and a space) are comments.
 */

export const normalizeTitle = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "");

export function findTrack(title: string, tracks: Track[]): Track | undefined {
  const key = title.trim().toLowerCase();
  const byKey = tracks.find((t) => t.key === key);
  if (byKey) return byKey;
  const n = normalizeTitle(title);
  return tracks.find((t) => normalizeTitle(t.name) === n);
}

const trimBlock = (s: string) => s.replace(/^\s*\n/, "").replace(/\s+$/, "");

export type ParsedSong = { title: string; track?: Track; lyrics: Lyrics };

export function parseLyricsFile(text: string, tracks: Track[]): ParsedSong[] {
  const blocks = text.replace(/\r/g, "").split(/^##[ \t]*/m).slice(1);
  return blocks.map((block) => {
    const nl = block.indexOf("\n");
    const title = (nl < 0 ? block : block.slice(0, nl)).trim();
    const body = (nl < 0 ? "" : block.slice(nl + 1))
      .split("\n")
      .filter((l) => !/^#\s/.test(l))
      .join("\n");
    const [original = "", ...rest] = body.split(/^-{3,}[ \t]*$/m);
    return {
      title,
      track: findTrack(title, tracks),
      lyrics: { original: trimBlock(original), traduccion: trimBlock(rest.join("\n")) },
    };
  });
}

export const isEmptyLyrics = (l: Lyrics) => !l.original && !l.traduccion;

/** Pairs original and translated lines by position; blank-on-both-sides lines become stanza gaps. */
export function pairLines(l: Lyrics): ({ original: string; traduccion: string } | null)[] {
  const o = l.original.split("\n");
  const t = l.traduccion.split("\n");
  return Array.from({ length: Math.max(o.length, t.length) }, (_, i) => {
    const a = o[i] ?? "";
    const b = t[i] ?? "";
    return !a.trim() && !b.trim() ? null : { original: a, traduccion: b };
  });
}

/** Builds the empty template file listing every song. */
export function lyricsTemplate(albums: { title: string; year: number; tracks: Track[] }[]): string {
  const lines = [
    "# Plantilla para importar letras en la web de Linkin Park.",
    '# Debajo de cada "## Canción" pegá la letra original, después una línea con ---, y después la traducción.',
    '# Las canciones que dejes vacías no se importan. Las líneas que empiezan con "# " son comentarios.',
    "",
  ];
  for (const a of albums) {
    lines.push(`# ===== ${a.title} (${a.year}) =====`);
    for (const t of a.tracks) lines.push(`## ${t.name}`, "", "---", "", "");
  }
  return lines.join("\n");
}
