import type { Album, Track } from "@/lib/types";
import { AlbumCover } from "./AlbumCover";
import styles from "./SongHeader.module.css";

export function SongHeader({ album, track }: { album: Album; track: Track }) {
  return (
    <section className={styles.head}>
      <AlbumCover album={album} size="small" />
      <div className={styles.text}>
        <div className="eyebrow">
          {album.title} · tema {track.n} de {album.tracks.length}
          {track.single && " · single"}
        </div>
        <h1 className="display">{track.name}</h1>
        {track.feat && <div className="lede">con {track.feat}</div>}
      </div>
    </section>
  );
}
