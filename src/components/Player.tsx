"use client";

import { useEffect, useState } from "react";
import { deleteAudio, saveAudio } from "@/lib/audioFiles";
import { embedFromUrl } from "@/lib/embed";
import { spotifyAlbumEmbed, spotifySearchUrl, youtubeSearchUrl } from "@/lib/links";
import { deletePlayerLink, getPlayerLink, savePlayerLink } from "@/lib/storage";
import { useAudioKeys } from "@/lib/useAudioKeys";
import { useStored } from "@/lib/useStored";
import type { Album, Track } from "@/lib/types";
import { usePlayer } from "./PlayerProvider";
import { useToast } from "./Toast";
import styles from "./Player.module.css";

/**
 * The site's own player for an audio file the visitor stored for this song, plus the official
 * Spotify album embed or a Spotify/YouTube link they saved. No audio is hosted by the site.
 */
export function Player({ album, track }: { album: Album; track: Track }) {
  const toast = useToast();
  const saved = useStored(() => getPlayerLink(track.key), [track.key]);
  const [draft, setDraft] = useState("");
  const player = usePlayer();
  const withAudio = useAudioKeys();
  const hasFile = withAudio.has(track.key);
  const isCurrent = player.current === track.key;

  useEffect(() => setDraft(saved ?? ""), [saved]);

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

  const own = embedFromUrl(saved);
  const embed = own ?? { src: spotifyAlbumEmbed(album.spotifyAlbumId), kind: "spotify-album" as const, height: 380 };

  function save() {
    const url = draft.trim();
    if (!embedFromUrl(url)) return toast("Ese enlace no es de Spotify ni de YouTube");
    savePlayerLink(track.key, url);
    toast("Enlace guardado");
  }

  return (
    <section className={styles.player} aria-label="Reproductor">
      <div className={styles.own}>
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
      </div>
      <iframe
        key={embed.src}
        title="Reproductor"
        src={embed.src}
        className={embed.kind === "youtube" ? styles.video : undefined}
        height={embed.height}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
      <p className="note">
        {own ? (
          "Reproduciendo el enlace que guardaste para esta canción."
        ) : (
          <>
            Reproductor oficial del álbum en Spotify: buscá <b>{track.name}</b> (tema {track.n}) en la lista. Para
            que suene esta canción directo, pegá abajo su enlace de Spotify o YouTube.
          </>
        )}
      </p>
      <div className="row">
        <a className="btn primary" href={spotifySearchUrl(track.name)} target="_blank" rel="noopener">
          ▶ Escuchar en Spotify ↗
        </a>
        <a className="btn" href={youtubeSearchUrl(track.name)} target="_blank" rel="noopener">
          Ver en YouTube ↗
        </a>
      </div>
      <div className="row">
        <input
          id="player-link"
          className="field"
          type="url"
          placeholder="Pegá el enlace de esta canción en Spotify o YouTube"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn" onClick={save}>
          Guardar enlace
        </button>
        {saved && (
          <button className="btn ghost" onClick={() => deletePlayerLink(track.key)}>
            Quitar
          </button>
        )}
      </div>
    </section>
  );
}
