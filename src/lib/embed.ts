export type Embed = { src: string; kind: "spotify-track" | "spotify-album" | "youtube"; height?: number };

/** Turns a Spotify or YouTube link pasted by the user into an embeddable player URL. */
export function embedFromUrl(url: string | null | undefined): Embed | null {
  if (!url) return null;
  const sp = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album)\/([A-Za-z0-9]{22})/);
  if (sp) {
    const kind = sp[1] === "track" ? "spotify-track" : "spotify-album";
    return { src: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}?theme=0`, kind, height: kind === "spotify-track" ? 152 : 380 };
  }
  const yt = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (yt) return { src: `https://www.youtube-nocookie.com/embed/${yt[1]}`, kind: "youtube" };
  return null;
}
