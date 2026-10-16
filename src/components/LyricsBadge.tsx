"use client";

import { getLyrics } from "@/lib/storage";
import { useStored } from "@/lib/useStored";

/** "Letra" chip, shown once the visitor has lyrics saved for the track. */
export function LyricsBadge({ trackKey }: { trackKey: string }) {
  const has = useStored(() => !!getLyrics(trackKey), [trackKey]);
  return has ? <span className="chip has">Letra</span> : null;
}
