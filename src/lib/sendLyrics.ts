import { findTrack } from "./importLyrics";
import type { Lyrics, Track } from "./types";

/**
 * "Enviar a mi sitio" bookmarklet. The visitor taps it on the lyrics page they have open; it reads that one
 * page's original and translated columns (or whatever text they selected) and opens /recibir/ on this site with
 * the text in the URL hash, which never leaves the browser. It reads nothing else and fetches nothing.
 */
const SOURCE = `(function(){
var site=__SITE__;
function txt(el){return (el.innerText||el.textContent||"").replace(/\\r/g,"").split("\\n").map(function(l){return l.trim()}).join("\\n").replace(/\\n{3,}/g,"\\n\\n").trim()}
var pairs=[[".lyric-original",".lyric-translation"],[".cnt-trad_l",".cnt-trad_r"],[".lyric-original",".lyric-translated"]];
var o="",t="";
var sel=String(window.getSelection?window.getSelection():"").trim();
if(sel){var p=sel.replace(/\\r/g,"").split(/^-{3,}[ \\t]*$/m);o=p[0].trim();t=(p[1]||"").trim()}
else{for(var i=0;i<pairs.length&&!o;i++){var a=document.querySelector(pairs[i][0]),b=document.querySelector(pairs[i][1]);if(a){o=txt(a);t=b?txt(b):""}}}
if(!o&&!t){alert("No encontré la letra en esta página. Seleccioná el texto de la letra y volvé a tocar el botón.");return}
var h=document.querySelector("h1");
var d={v:1,url:location.href,title:(h?h.innerText:document.title).trim(),original:o,traduccion:t};
location.href=site+"/recibir/#"+encodeURIComponent(JSON.stringify(d));
})()`;

/** The bookmarklet as a javascript: URL that sends to `origin` (e.g. "https://linkin-park.vercel.app"). */
export const bookmarkletHref = (origin: string) =>
  "javascript:" + encodeURIComponent(SOURCE.replace(/\n/g, "").replace("__SITE__", JSON.stringify(origin)));

export type Sent = { url: string; title: string; lyrics: Lyrics };

/** Reads what the bookmarklet put in the hash; null when it is missing or malformed. */
export function parseSent(hash: string): Sent | null {
  try {
    const d = JSON.parse(decodeURIComponent(hash.replace(/^#/, "")));
    if (typeof d !== "object" || !d || d.v !== 1) return null;
    const str = (x: unknown) => (typeof x === "string" ? x : "");
    const lyrics = { original: str(d.original).trim(), traduccion: str(d.traduccion).trim() };
    if (!lyrics.original && !lyrics.traduccion) return null;
    return { url: str(d.url), title: str(d.title), lyrics };
  } catch {
    return null;
  }
}

/** Finds the song by its letras.com page id first, then by the page title ("Numb - Linkin Park" → Numb). */
export function matchSent(sent: Pick<Sent, "url" | "title">, tracks: Track[]): Track | undefined {
  const id = sent.url.match(/letras\.com(?:\.br)?\/linkin-park\/(\d+)\//)?.[1];
  const byId = id ? tracks.find((t) => t.letrasUrl.endsWith(`/${id}/`)) : undefined;
  if (byId) return byId;
  const title = sent.title.replace(/\s+[-–|].*$/, "").replace(/\s*\(?(traducción|tradução|translation)\)?\s*$/i, "");
  return findTrack(title, tracks) ?? findTrack(sent.title, tracks);
}
