import Link from "next/link";
import type { Album } from "@/lib/types";
import { Account } from "./Account";
import { BackupPanel } from "./BackupPanel";
import styles from "./PageShell.module.css";

export type Crumb = { label: string; href?: string };

/** Header, breadcrumbs and album color theme shared by every page. */
export function PageShell({ crumbs, album, children }: { crumbs: Crumb[]; album?: Album; children: React.ReactNode }) {
  const theme = album
    ? ({ "--album": album.colors.album, "--on-album": album.colors.onAlbum } as React.CSSProperties)
    : undefined;
  return (
    <div className="wrap" style={theme}>
      <header className={styles.top}>
        <Link className={styles.brand} href="/">
          Linkin <span>Park</span>
        </Link>
        <nav aria-label="Ubicación">
          <ol className={styles.crumbs}>
            {crumbs.map((c) => (
              <li key={c.label}>{c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}</li>
            ))}
          </ol>
        </nav>
      </header>
      <Account />
      <main>{children}</main>
      <BackupPanel />
    </div>
  );
}
