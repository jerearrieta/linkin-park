"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { allTracks } from "@/lib/albums";
import { getLyrics, saveLyrics } from "@/lib/storage";
import { fillTranslation, getTranslator, googleTranslateUrl, missingTranslation } from "@/lib/translate";
import { useStored } from "@/lib/useStored";
import type { Lyrics, Track } from "@/lib/types";

const downloading = (f: number) => `Descargando el traductor… ${Math.round(f * 100)}%`;

/** Runs `job` once when `ready` turns true, and again on demand; tracks its progress text and failure. */
function useAutoRun(ready: boolean, job: (allowDownload: boolean, status: (s: string) => void) => Promise<void>) {
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const run = useCallback(
    async (allowDownload: boolean) => {
      setFailed(false);
      setBusy("Traduciendo al español…");
      try {
        await job(allowDownload, setBusy);
      } catch {
        setFailed(true);
      }
      setBusy(null);
    },
    [job],
  );
  useEffect(() => {
    if (ready && !started.current) {
      started.current = true;
      run(false);
    }
  }, [ready, run]);
  return { busy, failed, run };
}

/** Song page: fills the empty lines of the Spanish column as soon as the lyrics are shown. */
export function TranslateButton({ track, lyrics }: { track: Track; lyrics: Lyrics }) {
  const missing = missingTranslation(lyrics);
  const job = useCallback(
    async (allowDownload: boolean, status: (s: string) => void) => {
      const current = getLyrics(track.key);
      if (!current || !missingTranslation(current)) return;
      const translate = await getTranslator(allowDownload, (f) => status(downloading(f)));
      status("Traduciendo al español…");
      saveLyrics(track.key, await fillTranslation(current, translate));
    },
    [track.key],
  );
  const { busy, failed, run } = useAutoRun(missing, job);

  if (busy) return <span className="note">{busy}</span>;
  if (!missing) return null;
  return (
    <>
      <button className="btn" onClick={() => run(true)}>
        {failed ? "Reintentar traducción" : "Traducir al español"}
      </button>
      {failed && (
        <a className="btn" href={googleTranslateUrl(lyrics.original)} target="_blank" rel="noopener">
          Traducir en Google ↗
        </a>
      )}
    </>
  );
}

const pending = () =>
  allTracks.flatMap((t) => {
    const l = getLyrics(t.key);
    return l && missingTranslation(l) ? [t] : [];
  });

/** Home page: translates every saved song that still has lines without Spanish, on its own. */
export function TranslateAll() {
  const todo = useStored(pending);
  const job = useCallback(async (allowDownload: boolean, status: (s: string) => void) => {
    const tracks = pending();
    if (!tracks.length) return;
    const translate = await getTranslator(allowDownload, (f) => status(downloading(f)));
    let errors = 0;
    for (const [i, track] of tracks.entries()) {
      status(`Traduciendo letras al español: ${i + 1} de ${tracks.length} (${track.name})`);
      const l = getLyrics(track.key);
      try {
        if (l) saveLyrics(track.key, await fillTranslation(l, translate));
      } catch {
        errors++;
      }
    }
    if (errors) throw new Error(`${errors} failed`);
  }, []);
  const { busy, failed, run } = useAutoRun(!!todo?.length, job);

  if (busy) return <p className="note" style={{ marginTop: 18 }}>{busy}</p>;
  if (!todo?.length) return null;
  return (
    <div className="row" style={{ marginTop: 18 }}>
      <button className="btn primary" onClick={() => run(true)}>
        {failed ? `Reintentar: faltan traducir ${todo.length} letras` : `Traducir al español las ${todo.length} letras`}
      </button>
    </div>
  );
}
