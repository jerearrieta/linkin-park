import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumHeader } from "@/components/AlbumHeader";
import { PageShell } from "@/components/PageShell";
import { Pager } from "@/components/Pager";
import { TrackList } from "@/components/TrackList";
import { albumHref, albumNeighbors, albums, getAlbum } from "@/lib/albums";

type Props = { params: Promise<{ album: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => albums.map((a) => ({ album: a.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const album = getAlbum((await params).album);
  return { title: album?.title };
}

export default async function AlbumPage({ params }: Props) {
  const album = getAlbum((await params).album);
  if (!album) notFound();
  const { prev, next } = albumNeighbors(album);
  return (
    <PageShell album={album} crumbs={[{ label: "Discografía", href: "/" }, { label: album.title }]}>
      <AlbumHeader album={album} />
      <TrackList tracks={album.tracks} />
      <Pager
        prev={prev && { href: albumHref(prev), label: prev.title }}
        next={next && { href: albumHref(next), label: next.title }}
      />
    </PageShell>
  );
}
