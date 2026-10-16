import { AlbumShelf } from "@/components/AlbumShelf";
import { ImportLyrics } from "@/components/ImportLyrics";
import { PageShell } from "@/components/PageShell";
import { albums, totalTracks } from "@/lib/albums";

export default function Home() {
  return (
    <PageShell crumbs={[{ label: "Discografía" }]}>
      <div className="eyebrow">Discografía de estudio · 2000 a 2024</div>
      <h1 className="display" style={{ fontSize: "clamp(34px, 6vw, 64px)", marginTop: 6 }}>
        Ocho álbumes, {totalTracks} canciones
      </h1>
      <p className="lede">
        Elegí un álbum para ver sus canciones. Cada canción tiene su reproductor, de qué trata y la letra en dos
        columnas: original a la izquierda, en español a la derecha.
      </p>
      <ImportLyrics />
      <AlbumShelf albums={albums} />
    </PageShell>
  );
}
