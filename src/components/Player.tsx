"use client";

import { useEffect, useState } from "react";
import { embedFromUrl } from "@/lib/embed";
import { spotifyAlbumEmbed, spotifySearchUrl, youtubeSearchUrl } from "@/lib/links";
import { deletePlayerLink, getPlayerLink, savePlayerLink } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import type { Album, Track } from "@/lib/types";
import { useToast } from "./Toast";
import styles from "./Player.module.css";

/**
 * Plays the official Spotify album embed, or a Spotify/YouTube link the visitor saved for
 * this song, or an audio file from their own device. No audio is hosted by the site.
 */
export function Player({ album, track }: { album: Album; track: Track }) {
  const toast = useToast();
  const saved = useStored(() => getPlayerLink(track.key), [track.key]);
  const [draft, setDraft] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => setDraft(saved ?? ""), [saved]);
  useEffect(() => () => void (fileUrl && URL.revokeObjectURL(fileUrl)), [fileUrl]);

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
        <label className="btn" htmlFor="audio-file">
          Reproducir un archivo tuyo
        </label>
        <input
          id="audio-file"
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFileUrl(URL.createObjectURL(f));
          }}
        />
      </div>
      {fileUrl && <audio src={fileUrl} controls autoPlay />}
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
