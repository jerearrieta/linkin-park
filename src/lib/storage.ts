import type { Lyrics } from "./types";
import { userLyrics } from "@/data/lyrics";

// Everything the visitor adds lives in this browser's localStorage, under "lp:".
const PREFIX = "lp:";
const EVENT = "lp-storage";

function read<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}
function remove(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

/** Saved lyrics win over the ones bundled in src/data/lyrics.ts. */
export const getLyrics = (trackKey: string): Lyrics | null =>
  read<Lyrics>(`letra:${trackKey}`) ?? userLyrics[trackKey] ?? null;
export const saveLyrics = (trackKey: string, lyrics: Lyrics) => write(`letra:${trackKey}`, lyrics);
export const deleteLyrics = (trackKey: string) => remove(`letra:${trackKey}`);

export const getPlayerLink = (trackKey: string) => read<string>(`enlace:${trackKey}`);
export const savePlayerLink = (trackKey: string, url: string) => write(`enlace:${trackKey}`, url);
export const deletePlayerLink = (trackKey: string) => remove(`enlace:${trackKey}`);

/** Subscribe to changes made anywhere on the page (for live counters and badges). */
export function onStorageChange(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}
