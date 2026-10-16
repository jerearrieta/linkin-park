import Link from "next/link";
import { albumHref } from "@/lib/albums";
import type { Album } from "@/lib/types";
import { AlbumCover } from "./AlbumCover";
import styles from "./AlbumShelf.module.css";

export function AlbumShelf({ albums }: { albums: Album[] }) {
  return (
    <div className={styles.shelf}>
      {albums.map((a) => (
        <Link key={a.id} className={styles.sleeve} href={albumHref(a)}>
          <AlbumCover album={a} />
          <div className={styles.meta}>
            <b>{a.title}</b>
            <span>{a.tracks.length} temas</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
