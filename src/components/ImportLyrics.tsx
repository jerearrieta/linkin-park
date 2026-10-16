"use client";

import Link from "next/link";
import { useState } from "react";
import { allTracks, totalTracks } from "@/lib/albums";
import { isEmptyLyrics, parseLyricsFile } from "@/lib/importLyrics";
import { getLyrics, saveLyrics } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import styles from "./Import.module.css";

type Result = { imported: number; missing: string[]; found: number };

/** Lets the visitor load a .txt with many songs at once (format in /formato). */
export function ImportLyrics({ showHelpLink = true }: { showHelpLink?: boolean }) {
  const [result, setResult] = useState<Result | null>(null);
  const count = useStored(() => allTracks.filter((t) => getLyrics(t.key)).length);

  async function onFile(file: File) {
    const songs = parseLyricsFile(await file.text(), allTracks);
    let imported = 0;
    const missing: string[] = [];
    for (const s of songs) {
      if (!s.track) missing.push(s.title);
      else if (!isEmptyLyrics(s.lyrics) && saveLyrics(s.track.key, s.lyrics)) imported++;
    }
    setResult({ imported, missing, found: songs.length });
  }

  return (
    <>
      <div className={styles.bar}>
        <label className="btn primary" htmlFor="import-file">
          Importar archivo de letras (.txt)
        </label>
        <input
          id="import-file"
          type="file"
          accept=".txt,text/plain"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
        <span className="note">
          {count ?? 0} de {totalTracks} canciones con letra cargada.
          {showHelpLink && (
            <>
              {" "}
              <Link href="/formato/">Cómo armar el archivo</Link> ·{" "}
              <Link href="/boton/">Cargar letras con un clic</Link>
            </>
          )}
        </span>
      </div>
      {result && (
        <div className={styles.result} role="status">
          <b>{result.imported} letras importadas.</b>
          {result.missing.length > 0 && (
            <p>No encontré estas canciones (revisá cómo está escrito el título): {result.missing.join(", ")}</p>
          )}
          {result.found === 0 && <p>El archivo no tiene canciones con el formato &quot;## Título&quot;.</p>}
        </div>
      )}
    </>
  );
}
