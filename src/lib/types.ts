export type AlbumColors = {
  /** Sleeve background */
  bg: string;
  /** Sleeve text */
  ink: string;
  /** Year label on the sleeve */
  accent: string;
  /** Accent color the whole page takes while browsing this album */
  album: string;
  /** Text color on top of `album` */
  onAlbum: string;
  /** CSS background layered over the sleeve */
  motif: string;
};

/** A track as written in the data file: a title, or [title, featured artist]. */
export type TrackInput = string | [title: string, feat: string];

export type AlbumInput = {
  /** Short id, also used in storage keys (e.g. "met" → "met-13") */
  id: string;
  /** URL slug */
  slug: string;
  title: string;
  year: number;
  date: string;
  producers: string;
  note: string;
  colors: AlbumColors;
  singles: string[];
  tracks: TrackInput[];
  /** letras.com page id for each track, in track order */
  letrasIds: string[];
};

export type Track = {
  /** Stable key "<album id>-<n>", e.g. "met-13" */
  key: string;
  n: number;
  name: string;
  feat: string | null;
  single: boolean;
  letrasUrl: string;
  albumSlug: string;
};

export type Album = Omit<AlbumInput, "tracks" | "letrasIds" | "singles"> & {
  n: number;
  tracks: Track[];
};

export type Lyrics = { original: string; traduccion: string };
