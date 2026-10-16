"use client";

import { useRef } from "react";
import { allTracks } from "@/lib/albums";
import { getLyrics, saveLyrics } from "@/lib/storage";
import type { Lyrics } from "@/lib/types";
import { useToast } from "./Toast";
import styles from "./BackupPanel.module.css";

type Backup = { letras: Record<string, Lyrics> };

function dump(): string {
  const out: Backup = { letras: {} };
  for (const t of allTracks) {
    const l = getLyrics(t.key);
    if (l) out.letras[t.key] = l;
  }
  return JSON.stringify(out, null, 1);
}

/** Copy/paste backup of everything saved in this browser, to move it to another device. */
export function BackupPanel() {
  const toast = useToast();
  const box = useRef<HTMLTextAreaElement>(null);

  function copy() {
    const ta = box.current!;
    ta.value = dump();
    navigator.clipboard?.writeText(ta.value).then(
      () => toast("Copiado"),
      () => {
        ta.select();
        toast("Seleccionado: copialo con Ctrl+C");
      },
    );
  }

  function restore() {
    try {
      const d = JSON.parse(box.current!.value) as Partial<Backup>;
      let n = 0;
      for (const [k, v] of Object.entries(d.letras ?? {})) if (saveLyrics(k, v)) n++;
      toast(`${n} letras importadas`);
    } catch {
      toast("El texto pegado no es una copia válida");
    }
  }

  return (
    <details
      className={styles.backup}
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open && box.current) box.current.value = dump();
      }}
    >
      <summary>Copia de seguridad de tus letras</summary>
      <p className="note" style={{ marginTop: 10 }}>
        Tus letras se guardan solo en este navegador. Los archivos de audio no entran en esta copia. Copiá este texto para respaldarlas o pasarlas a
        otro equipo, y pegalo acá para importarlas.
      </p>
      <textarea id="backup-text" ref={box} spellCheck={false} aria-label="Copia de seguridad" />
      <div className="row">
        <button className="btn" onClick={copy}>
          Copiar todo
        </button>
        <button className="btn" onClick={restore}>
          Importar lo pegado
        </button>
      </div>
    </details>
  );
}
