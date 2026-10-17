import type { Lyrics } from "./types";
import { userLyrics } from "@/data/lyrics";
import { pushLyrics, removeCloudLyrics } from "./cloud";

// Everything the visitor adds lives in this browser's localStorage, under "lp:". Lyrics are also
// copied to the signed-in account (lib/cloud.ts), so they show up on any computer.
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
/** Only this browser's copy: used when the account's lyrics come down. */
export const saveLocalLyrics = (trackKey: string, lyrics: Lyrics) => write(`letra:${trackKey}`, lyrics);
export function saveLyrics(trackKey: string, lyrics: Lyrics) {
  void pushLyrics(trackKey, lyrics);
  return saveLocalLyrics(trackKey, lyrics);
}
export function deleteLyrics(trackKey: string) {
  void removeCloudLyrics(trackKey);
  remove(`letra:${trackKey}`);
}


/** Subscribe to changes made anywhere on the page (for live counters and badges). */
export function onStorageChange(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}

export const getVolume = () => read<number>("volumen") ?? 0.8;
export const saveVolume = (v: number) => write("volumen", v);
