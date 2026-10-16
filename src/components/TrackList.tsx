import Link from "next/link";
import { trackHref } from "@/lib/albums";
import type { Track } from "@/lib/types";
import { LyricsBadge } from "./LyricsBadge";
import styles from "./TrackList.module.css";

export function TrackList({ tracks }: { tracks: Track[] }) {
  return (
    <ol className={styles.tracks}>
      {tracks.map((t) => (
        <li key={t.key}>
          <Link href={trackHref(t)}>
            <span className={styles.n}>{t.n}</span>
            <span className={styles.name}>
              {t.name}
              {t.feat && <span className={styles.feat}> con {t.feat}</span>}
            </span>
            <span className={styles.chips}>
              {t.single && <span className="chip single">Single</span>}
              <LyricsBadge trackKey={t.key} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
