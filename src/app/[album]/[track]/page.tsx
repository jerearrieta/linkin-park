import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LyricsPanel } from "@/components/LyricsPanel";
import { PageShell } from "@/components/PageShell";
import { Pager } from "@/components/Pager";
import { Player } from "@/components/Player";
import { SongAbout } from "@/components/SongAbout";
import { SongHeader } from "@/components/SongHeader";
import { explanations } from "@/data/explanations";
import { albumHref, albumNeighbors, albums, getAlbum, getTrack, trackHref } from "@/lib/albums";

type Props = { params: Promise<{ album: string; track: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  albums.flatMap((a) => a.tracks.map((t) => ({ album: a.slug, track: String(t.n) })));

async function resolve(params: Props["params"]) {
  const p = await params;
  const album = getAlbum(p.album);
  const track = album && getTrack(album, Number(p.track));
  return album && track ? { album, track } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await resolve(params);
  return { title: r ? `${r.track.name} · ${r.album.title}` : undefined };
}

export default async function SongPage({ params }: Props) {
  const r = await resolve(params);
  if (!r) notFound();
  const { album, track } = r;
  const prevTrack = getTrack(album, track.n - 1);
  const nextTrack = getTrack(album, track.n + 1);
  const nextAlbum = albumNeighbors(album).next;

  return (
    <PageShell
      album={album}
      crumbs={[{ label: "Discografía", href: "/" }, { label: album.title, href: albumHref(album) }, { label: track.name }]}
    >
      <SongHeader album={album} track={track} />
      <Player album={album} track={track} />
      <SongAbout text={explanations[track.key]} />
      <LyricsPanel track={track} />
      <Pager
        prev={prevTrack ? { href: trackHref(prevTrack), label: prevTrack.name } : { href: albumHref(album), label: "Volver al álbum" }}
        next={
          nextTrack
            ? { href: trackHref(nextTrack), label: nextTrack.name }
            : nextAlbum && { href: albumHref(nextAlbum), label: `Siguiente álbum: ${nextAlbum.title}` }
        }
      />
    </PageShell>
  );
}
