"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { allTracks, trackHref } from "@/lib/albums";
import { getLyrics, saveLyrics } from "@/lib/storage";
import { matchSent, parseSent, type Sent } from "@/lib/sendLyrics";
import type { Track } from "@/lib/types";
import { LyricsColumns } from "./LyricsPanel";
import styles from "./Import.module.css";

type State = { sent: Sent; track?: Track; saved: boolean } | "empty" | null;

/** First song without lyrics after `from` (wrapping around), so the visitor can keep going. */
function nextMissing(from?: Track) {
  const i = from ? allTracks.indexOf(from) : -1;
  const order = [...allTracks.slice(i + 1), ...allTracks.slice(0, i + 1)];
  return order.find((t) => !getLyrics(t.key));
}

/** Landing page for the "Enviar a mi sitio" bookmarklet: saves what it sent into the matching song. */
export function ReceiveLyrics() {
  const [state, setState] = useState<State>(null);
  const [pick, setPick] = useState("");

  useEffect(() => {
    const sent = parseSent(window.location.hash);
    history.replaceState(null, "", window.location.pathname);
    if (!sent) return setState("empty");
    const track = matchSent(sent, allTracks);
    // Fill an empty song right away; replacing lyrics already there waits for a click.
    const saved = !!track && !getLyrics(track.key) && saveLyrics(track.key, sent.lyrics);
    setState({ sent, track, saved });
  }, []);

  if (state === null) return null;
  if (state === "empty")
    return (
      <p className="note">
        No llegó ninguna letra. Instalá el botón desde <Link href="/boton/">Cargar letras con un clic</Link> y tocá el
        botón en la página de la canción.
      </p>
    );

  const { sent, track, saved } = state;
  const save = (t: Track) => saveLyrics(t.key, sent.lyrics) && setState({ sent, track: t, saved: true });
  const next = saved ? nextMissing(track) : undefined;

  return (
    <>
      <div className={styles.result} role="status">
        {saved && track ? (
          <b>Letra guardada en {track.name}.</b>
        ) : track ? (
          <>
            <b>{track.name} ya tenía letra.</b>
            <div className="row">
              <button className="btn primary" onClick={() => save(track)}>
                Reemplazarla por esta
              </button>
              <Link className="btn ghost" href={trackHref(track)}>
                Dejar la que estaba
              </Link>
            </div>
          </>
        ) : (
          <>
            <b>No reconocí la canción &quot;{sent.title || "sin título"}&quot;. Elegí cuál es:</b>
            <div className="row">
              <select className="field" value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">Elegí una canción</option>
                {allTracks.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                className="btn primary"
                disabled={!pick}
                onClick={() => {
                  const t = allTracks.find((x) => x.key === pick);
                  if (t) save(t);
                }}
              >
                Guardar
              </button>
            </div>
          </>
        )}
        {saved && track && (
          <div className="row">
            <Link className="btn" href={trackHref(track)}>
              Ver la canción
            </Link>
            {next ? (
              <a className="btn primary" href={`${next.letrasUrl}traduccion.html`}>
                Siguiente sin letra: {next.name} ↗
              </a>
            ) : (
              <span className="note">Ya están todas las canciones con letra.</span>
            )}
          </div>
        )}
        {!sent.lyrics.traduccion && (
          <p>Llegó solo la letra original. Si querés la traducción, agregala desde la página de la canción.</p>
        )}
      </div>
      <LyricsColumns lyrics={sent.lyrics} />
    </>
  );
}
