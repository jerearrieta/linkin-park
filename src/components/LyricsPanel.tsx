"use client";

import { useState } from "react";
import { pairLines } from "@/lib/lyrics";
import { deleteLyrics, getLyrics, saveLyrics } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import type { Lyrics, Track } from "@/lib/types";
import { useToast } from "./Toast";
import styles from "./Lyrics.module.css";

/**
 * Two-column lyrics: original on the left, Spanish on the right, aligned line by line.
 * The text comes from the visitor (typed or pasted); the site ships none.
 */
export function LyricsPanel({ track }: { track: Track }) {
  const lyrics = useStored(() => getLyrics(track.key), [track.key]);
  const [editing, setEditing] = useState(false);

  return (
    <section className={styles.lyrics}>
      <div className={styles.head}>
        <h2 className="display">Letra</h2>
        <div className="row">
          <a className="btn" href={`${track.letrasUrl}traduccion.html`} target="_blank" rel="noopener">
            Letra y traducción en letras.com ↗
          </a>
          {!editing && (
            <button className="btn" onClick={() => setEditing(true)}>
              {lyrics ? "Editar letra" : "Agregar letra"}
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <LyricsEditor track={track} initial={lyrics ?? null} onDone={() => setEditing(false)} />
      ) : lyrics ? (
        <LyricsColumns lyrics={lyrics} />
      ) : (
        <div className={styles.empty}>
          <h3>Esta canción todavía no tiene letra cargada</h3>
          <p>
            Las letras de Linkin Park tienen derechos de autor, así que la página no las trae copiadas. Pegá la
            letra original a la izquierda y la traducción a la derecha. Queda guardada en este navegador.
          </p>
          <div>
            <button className="btn primary" onClick={() => setEditing(true)}>
              Agregar letra
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function LyricsColumns({ lyrics }: { lyrics: Lyrics }) {
  return (
    <>
      <div className={styles.labels}>
        <div>Original</div>
        <div>Español</div>
      </div>
      <div className={styles.pairs}>
        {pairLines(lyrics).map((p, i) =>
          p ? (
            <div key={i} className={styles.pair}>
              <p>{p.original}</p>
              <p>{p.traduccion}</p>
            </div>
          ) : (
            <div key={i} className={styles.gap} />
          ),
        )}
      </div>
    </>
  );
}

function LyricsEditor({ track, initial, onDone }: { track: Track; initial: Lyrics | null; onDone: () => void }) {
  const toast = useToast();
  const [original, setOriginal] = useState(initial?.original ?? "");
  const [traduccion, setTraduccion] = useState(initial?.traduccion ?? "");

  function save() {
    const value = { original: original.replace(/\s+$/, ""), traduccion: traduccion.replace(/\s+$/, "") };
    if (!value.original && !value.traduccion) return toast("Las dos columnas están vacías");
    toast(saveLyrics(track.key, value) ? "Letra guardada" : "No se pudo guardar en este navegador");
    onDone();
  }

  return (
    <div className={styles.editor}>
      <div className={styles.two}>
        <label htmlFor="lyrics-original">
          Original (inglés)
          <textarea
            id="lyrics-original"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Pegá la letra original, un verso por línea"
          />
        </label>
        <label htmlFor="lyrics-translation">
          Traducción al español
          <textarea
            id="lyrics-translation"
            value={traduccion}
            onChange={(e) => setTraduccion(e.target.value)}
            placeholder="Escribí tu traducción, un verso por línea para que quede alineada"
          />
        </label>
      </div>
      <p className="note">
        Las líneas se emparejan por posición: la línea 5 de la izquierda queda al lado de la línea 5 de la derecha.
        Dejá una línea en blanco entre estrofas en las dos columnas.
      </p>
      <div className="row">
        <button className="btn primary" onClick={save}>
          Guardar letra
        </button>
        <button className="btn ghost" onClick={onDone}>
          Cancelar
        </button>
        {initial && (
          <button
            className="btn ghost"
            onClick={() => {
              deleteLyrics(track.key);
              onDone();
            }}
          >
            Borrar letra
          </button>
        )}
      </div>
    </div>
  );
}
