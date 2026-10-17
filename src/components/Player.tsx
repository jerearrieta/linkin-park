"use client";

import { deleteAudio, saveAudio } from "@/lib/audioFiles";
import { useAudioKeys } from "@/lib/useAudioKeys";
import type { Album, Track } from "@/lib/types";
import { usePlayer } from "./PlayerProvider";
import { useToast } from "./Toast";
import styles from "./Player.module.css";

/**
 * The site's own player for an audio file the visitor stored for this song. Playback happens in
 * the bar at the bottom (PlayerBar). No audio is hosted by the site.
 */
export function Player({ album, track }: { album: Album; track: Track }) {
  const toast = useToast();
  const player = usePlayer();
  const withAudio = useAudioKeys();
  const hasFile = withAudio.has(track.key);
  const isCurrent = player.current === track.key;

  /** Queues the album's songs that have a file, starting with this one. */
  function play(extra?: string) {
    if (isCurrent && !extra) return player.toggle();
    const keys = album.tracks.map((t) => t.key).filter((k) => withAudio.has(k) || k === extra);
    player.playList(keys, track.key);
  }

  async function pickFile(file: File | undefined) {
    if (!file) return;
    try {
      await saveAudio(track.key, file);
      play(track.key);
    } catch {
      toast("No se pudo guardar el archivo: puede que no haya espacio en el navegador");
    }
  }

  async function removeFile() {
    if (isCurrent) player.close();
    await deleteAudio(track.key).catch(() => {});
    toast("Archivo quitado");
  }

  return (
    <section className={styles.player} aria-label="Reproductor">
      <div className="eyebrow">Tu reproductor</div>
      <div className="row">
        {hasFile ? (
          <>
            <button className="btn primary" onClick={() => play()}>
              {isCurrent && player.playing ? "❚❚ Pausa" : "▶ Reproducir"}
            </button>
            <label className="btn" htmlFor="audio-file">
              Cambiar archivo
            </label>
            <button className="btn ghost" onClick={removeFile}>
              Quitar archivo
            </button>
          </>
        ) : (
          <label className="btn primary" htmlFor="audio-file">
            ▶ Elegir un archivo de audio
          </label>
        )}
        <input
          id="audio-file"
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            void pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <p className="note">
        {hasFile
          ? "Suena en la barra de abajo y sigue sonando aunque cambies de página. Pasa sola a las canciones del álbum que también tengan archivo."
          : "Elegí el archivo de esta canción desde tu equipo. Queda guardado solo en este navegador, no se sube a ningún lado."}
      </p>
    </section>
  );
}
