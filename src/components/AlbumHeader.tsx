import Link from "next/link";
import { albums, trackHref } from "@/lib/albums";
import { spotifyAlbumUrl } from "@/lib/links";
import type { Album } from "@/lib/types";
import { AlbumCover } from "./AlbumCover";
import styles from "./AlbumHeader.module.css";

export function AlbumHeader({ album }: { album: Album }) {
  return (
    <section className={styles.head}>
      <AlbumCover album={album} size="large" />
      <div>
        <div className="eyebrow">
          Álbum {album.n} de {albums.length}
        </div>
        <h1 className="display">{album.title}</h1>
        <p className="lede">{album.note}</p>
        <div className={styles.facts}>
          <span>
            Salida <b>{album.date}</b>
          </span>
          <span>
            Producción <b>{album.producers}</b>
          </span>
          <span>
            <b>{album.tracks.length}</b> canciones
          </span>
        </div>
        <div className={`row ${styles.actions}`}>
          <Link className="btn primary" href={trackHref(album.tracks[0])}>
            ▶ Empezar por el tema 1
          </Link>
          <a className="btn" href={spotifyAlbumUrl(album.spotifyAlbumId)} target="_blank" rel="noopener">
            Álbum en Spotify ↗
          </a>
        </div>
      </div>
    </section>
  );
}
