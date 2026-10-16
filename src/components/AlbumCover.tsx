import type { Album } from "@/lib/types";
import styles from "./AlbumCover.module.css";

/** Typographic sleeve drawn in the album's own colors (no copyrighted artwork). */
export function AlbumCover({ album, size = "medium" }: { album: Album; size?: "small" | "medium" | "large" }) {
  const vars = {
    "--c-bg": album.colors.bg,
    "--c-ink": album.colors.ink,
    "--c-accent": album.colors.accent,
    "--c-motif": album.colors.motif,
  } as React.CSSProperties;
  return (
    <div className={`${styles.cover} ${size !== "medium" ? styles[size] : ""}`} style={vars} aria-hidden="true">
      <div className={styles.num}>LP · {String(album.n).padStart(2, "0")}</div>
      <div className={styles.title}>{album.title}</div>
      <div className={styles.year}>{album.year}</div>
    </div>
  );
}

