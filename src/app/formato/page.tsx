import type { Metadata } from "next";
import { ImportLyrics } from "@/components/ImportLyrics";
import { PageShell } from "@/components/PageShell";
import { albums } from "@/lib/albums";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Cómo armar el archivo de letras" };

const example = `## Numb
primer verso original
segundo verso original

primer verso de la siguiente estrofa
---
primer verso traducido
segundo verso traducido

primer verso traducido de la siguiente estrofa

## In the End
...`;

export default function FormatPage() {
  return (
    <PageShell crumbs={[{ label: "Discografía", href: "/" }, { label: "Formato del archivo" }]}>
      <div className="eyebrow">Importar letras</div>
      <h1 className="display" style={{ fontSize: "clamp(34px, 6vw, 56px)", marginTop: 6 }}>
        Cómo armar el archivo
      </h1>
      <div className={styles.format}>
        <p>
          Un solo archivo de texto (.txt, por ejemplo hecho en el Bloc de notas) puede tener todas las canciones que
          quieras. Para cada una:
        </p>
        <ol>
          <li>
            Una línea que empiece con <code>##</code> y el nombre de la canción.
          </li>
          <li>Debajo, la letra original.</li>
          <li>
            Una línea con solo <code>---</code>.
          </li>
          <li>Debajo, la traducción. Un verso por línea, en el mismo orden que el original, para que quede alineado.</li>
        </ol>
        <pre>{example}</pre>
        <p>
          El nombre no distingue mayúsculas ni acentos, y lo que esté entre paréntesis se ignora. Las líneas que
          empiezan con un solo <code>#</code> son comentarios. Si importás de nuevo una canción, se reemplaza la versión
          anterior. Las canciones que quedan vacías se saltean.
        </p>
        <p>
          <a className="btn" href="/plantilla-letras.txt" target="_blank">
            Abrir la plantilla con las {albums.reduce((s, a) => s + a.tracks.length, 0)} canciones
          </a>
        </p>
        <p>Lista de nombres que reconoce la web:</p>
        <div className={styles.names}>
          {albums.map((a) => (
            <div key={a.id}>
              <b>{a.title}</b>
              <span>{a.tracks.map((t) => t.name).join(" · ")}</span>
            </div>
          ))}
        </div>
        <ImportLyrics showHelpLink={false} />
      </div>
    </PageShell>
  );
}
