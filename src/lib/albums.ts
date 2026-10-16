import { albumData } from "@/data/albums";
import type { Album, Track } from "./types";

export const albums: Album[] = albumData.map((a, i) => {
  const { tracks, letrasIds, singles, ...rest } = a;
  return {
    ...rest,
    n: i + 1,
    tracks: tracks.map((t, j): Track => {
      const [name, feat] = Array.isArray(t) ? t : [t, null];
      const letrasId = letrasIds[j];
      return {
        key: `${a.id}-${j + 1}`,
        n: j + 1,
        name,
        feat,
        single: singles.includes(name),
        albumSlug: a.slug,
        letrasUrl: letrasId
          ? `https://www.letras.com/linkin-park/${letrasId}/`
          : "https://www.letras.com/linkin-park/",
      };
    }),
  };
});

export const allTracks: Track[] = albums.flatMap((a) => a.tracks);
export const totalTracks = allTracks.length;

export function getAlbum(slug: string): Album | undefined {
  return albums.find((a) => a.slug === slug);
}

export function getTrack(album: Album, n: number): Track | undefined {
  return album.tracks[n - 1];
}

/** Previous/next album in release order. */
export function albumNeighbors(album: Album) {
  return { prev: albums[album.n - 2], next: albums[album.n] };
}

export const albumHref = (a: Pick<Album, "slug">) => `/${a.slug}/`;
export const trackHref = (t: Pick<Track, "albumSlug" | "n">) => `/${t.albumSlug}/${t.n}/`;
