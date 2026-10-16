"use client";

import { useAudioKeys } from "@/lib/useAudioKeys";
import { usePlayer } from "./PlayerProvider";

/** "Sonando" on the song in the player, "Audio" on songs with a stored file. */
export function AudioBadge({ trackKey }: { trackKey: string }) {
  const { current } = usePlayer();
  const has = useAudioKeys().has(trackKey);
  if (current === trackKey) return <span className="chip has">Sonando</span>;
  return has ? <span className="chip">Audio</span> : null;
}
