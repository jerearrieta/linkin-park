const query = (s: string) => encodeURIComponent(`Linkin Park ${s}`);

export const spotifySearchUrl = (title: string) => `https://open.spotify.com/search/${query(title)}`;
export const youtubeSearchUrl = (title: string) =>
  `https://www.youtube.com/results?search_query=${query(`${title} official`)}`;
export const spotifyAlbumUrl = (id: string) => `https://open.spotify.com/album/${id}`;
export const spotifyAlbumEmbed = (id: string) => `https://open.spotify.com/embed/album/${id}?theme=0`;
