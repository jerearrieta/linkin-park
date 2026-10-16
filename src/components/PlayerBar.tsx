"use client";

import Link from "next/link";
import { findByKey, trackHref } from "@/lib/albums";
import { usePlayer, usePlayerTime } from "./PlayerProvider";
import styles from "./PlayerBar.module.css";

const clock = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const REPEAT_LABEL = { off: "Repetir: no", all: "Repetir: todo", one: "Repetir: esta canción" } as const;

/** Bar fixed to the bottom of every page while something is in the queue. */
export function PlayerBar() {
  const p = usePlayer();
  const { time, duration } = usePlayerTime();
  const found = p.current ? findByKey(p.current) : undefined;
  if (!p.queue || !found) return null;
  const { album, track } = found;
  const repeat = p.queue.repeat;
  const theme = { "--album": album.colors.album, "--on-album": album.colors.onAlbum } as React.CSSProperties;

  return (
    <>
      <div className={styles.spacer} aria-hidden />
      <section className={styles.bar} style={theme} aria-label="Barra de reproducción">
        <div className={styles.now}>
          <Link href={trackHref(track)} className={styles.title}>
            {track.name}
          </Link>
          <span className={styles.sub}>
            {p.error ?? `${album.title} · ${p.queue.pos + 1} de ${p.queue.items.length}`}
          </span>
        </div>

        <div className={styles.center}>
          <div className={styles.controls}>
            <button
              className={styles.mode}
              aria-pressed={p.queue.shuffle}
              title={p.queue.shuffle ? "Aleatorio: sí" : "Aleatorio: no"}
              aria-label="Aleatorio"
              onClick={p.toggleShuffle}
            >
              ⤨
            </button>
            <button className={styles.icon} aria-label="Anterior" onClick={p.prev}>
              ⏮
            </button>
            <button className={styles.play} aria-label={p.playing ? "Pausa" : "Reproducir"} onClick={p.toggle}>
              {p.playing ? "❚❚" : "▶"}
            </button>
            <button className={styles.icon} aria-label="Siguiente" onClick={p.next}>
              ⏭
            </button>
            <button
              className={styles.mode}
              aria-pressed={repeat !== "off"}
              title={REPEAT_LABEL[repeat]}
              aria-label={REPEAT_LABEL[repeat]}
              onClick={p.cycleRepeat}
            >
              {repeat === "one" ? "↻¹" : "↻"}
            </button>
          </div>
          <div className={styles.progress}>
            <span>{clock(time)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(time, duration || 0)}
              onChange={(e) => p.seek(Number(e.target.value))}
              aria-label="Posición"
              style={{ "--fill": `${duration ? (time / duration) * 100 : 0}%` } as React.CSSProperties}
            />
            <span>{clock(duration)}</span>
          </div>
        </div>

        <div className={styles.side}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            aria-label="Volumen"
            style={{ "--fill": `${p.volume * 100}%` } as React.CSSProperties}
          />
          <button className={styles.icon} aria-label="Cerrar reproductor" onClick={p.close}>
            ✕
          </button>
        </div>
      </section>
    </>
  );
}
