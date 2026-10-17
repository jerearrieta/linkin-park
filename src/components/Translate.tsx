"use client";

import { useEffect, useState } from "react";
import { allTracks } from "@/lib/albums";
import { getLyrics, saveLyrics } from "@/lib/storage";
import { canTranslate, createTranslator, fillTranslation, googleTranslateUrl, missingTranslation } from "@/lib/translate";
import { useStored } from "@/lib/useStored";
import type { Lyrics, Track } from "@/lib/types";
import { useToast } from "./Toast";

function useCanTranslate() {
  const [ok, setOk] = useState<boolean>();
  useEffect(() => {
    canTranslate().then(setOk);
  }, []);
  return ok;
}

const downloading = (f: number) => `Descargando el traductor… ${Math.round(f * 100)}%`;

/** Song page: fills the empty lines of the Spanish column, or opens Google Translate where the browser can't. */
export function TranslateButton({ track, lyrics }: { track: Track; lyrics: Lyrics }) {
  const toast = useToast();
  const ok = useCanTranslate();
  const [busy, setBusy] = useState<string | null>(null);

  if (ok === undefined || !missingTranslation(lyrics)) return null;
  if (!ok)
    return (
      <a className="btn" href={googleTranslateUrl(lyrics.original)} target="_blank" rel="noopener">
        Traducir en Google ↗
      </a>
    );

  async function run() {
    setBusy("Traduciendo…");
    try {
      const translate = await createTranslator((f) => setBusy(downloading(f)));
      setBusy("Traduciendo…");
      const filled = await fillTranslation(lyrics, translate);
      toast(saveLyrics(track.key, filled) ? "Traducción guardada" : "No se pudo guardar en este navegador");
    } catch {
      toast("No se pudo traducir");
    }
    setBusy(null);
  }

  return (
    <button className="btn" onClick={run} disabled={!!busy}>
      {busy ?? "Traducir al español"}
    </button>
  );
}

const pending = () =>
  allTracks.flatMap((t) => {
    const l = getLyrics(t.key);
    return l && missingTranslation(l) ? [{ track: t, lyrics: l }] : [];
  });

/** Home page: translates every saved song that still has lines without Spanish. */
export function TranslateAll() {
  const toast = useToast();
  const ok = useCanTranslate();
  const todo = useStored(pending);
  const [busy, setBusy] = useState<string | null>(null);

  if (!todo?.length || ok === undefined) return null;

  async function run() {
    setBusy("Preparando…");
    let done = 0;
    try {
      const translate = await createTranslator((f) => setBusy(downloading(f)));
      for (const { track, lyrics } of todo!) {
        setBusy(`Traduciendo ${done + 1} de ${todo!.length}: ${track.name}`);
        if (saveLyrics(track.key, await fillTranslation(lyrics, translate))) done++;
      }
      toast(`${done} canciones traducidas`);
    } catch {
      toast(done ? `Se tradujeron ${done}; las demás fallaron` : "No se pudo traducir");
    }
    setBusy(null);
  }

  return (
    <div className="row" style={{ marginTop: 18 }}>
      {ok ? (
        <button className="btn primary" onClick={run} disabled={!!busy}>
          {busy ?? `Traducir al español las ${todo.length} letras sin traducción`}
        </button>
      ) : (
        <p className="note">
          {todo.length} letras no tienen traducción todavía. Para traducirlas todas de una vez, abrí esta página en
          Chrome de computadora; en cada canción también podés usar el botón “Traducir en Google”.
        </p>
      )}
    </div>
  );
}
