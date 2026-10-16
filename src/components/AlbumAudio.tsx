"use client";

import { matchAudioFile, saveAudio } from "@/lib/audioFiles";
import { useAudioKeys } from "@/lib/useAudioKeys";
import type { Album } from "@/lib/types";
import { usePlayer } from "./PlayerProvider";
import { useToast } from "./Toast";

/** Plays the album in the site's player, and loads many audio files at once matched by name. */
export function AlbumAudio({ album }: { album: Album }) {
  const player = usePlayer();
  const toast = useToast();
  const withAudio = useAudioKeys();
  const keys = album.tracks.map((t) => t.key).filter((k) => withAudio.has(k));

  async function load(files: FileList | null) {
    if (!files?.length) return;
    let saved = 0;
    const missed: string[] = [];
    for (const f of Array.from(files)) {
      const t = matchAudioFile(f.name, album.tracks);
      if (!t) {
        missed.push(f.name);
        continue;
      }
      try {
        await saveAudio(t.key, f);
        saved++;
      } catch {
        toast("No se pudo guardar: puede que no haya espacio en el navegador");
        return;
      }
    }
    toast(
      missed.length
        ? `${saved} canciones cargadas. Sin reconocer: ${missed.slice(0, 3).join(", ")}${missed.length > 3 ? "…" : ""}`
        : `${saved} canciones cargadas`,
    );
  }

  return (
    <>
      <button className="btn" disabled={!keys.length} onClick={() => player.playList(keys, keys[0])}>
        ▶ Reproducir con tus archivos ({keys.length}/{album.tracks.length})
      </button>
      <label className="btn" htmlFor="album-files">
        Cargar archivos del álbum
      </label>
      <input
        id="album-files"
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(e) => {
          void load(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}
