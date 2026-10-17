import type { Lyrics } from "./types";

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
