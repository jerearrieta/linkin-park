import type { Album } from "@/lib/types";
import styles from "./AlbumCover.module.css";

/** The album's cover art, from public/portadas/<album id>.jpg. */
export function AlbumCover({ album, size = "medium" }: { album: Album; size?: "small" | "medium" | "large" }) {
  return (
    <div className={styles.cover} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
      <img src={`/portadas/${album.id}.jpg`} alt="" loading={size === "large" ? "eager" : "lazy"} />
    </div>
  );
}
