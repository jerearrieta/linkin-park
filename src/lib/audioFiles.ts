import { normalizeTitle } from "./importLyrics";
import type { Track } from "./types";

/**
 * Audio files the visitor picks from their own device, kept in this browser's IndexedDB under the
 * track key so they survive reloads. They never leave the browser: the site hosts no audio.
 */
const DB = "lp-audio";
const STORE = "files";
const EVENT = "lp-audio";

export type StoredAudio = { blob: Blob; name: string };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = run(t.objectStore(STORE));
      t.oncomplete = () => resolve(req.result);
      t.onerror = t.onabort = () => reject(t.error ?? req.error);
    });
  } finally {
    db.close();
  }
}

const changed = () => window.dispatchEvent(new Event(EVENT));

export const getAudio = (key: string) => tx<StoredAudio | undefined>("readonly", (s) => s.get(key));

export async function saveAudio(key: string, file: File) {
  // Ask the browser not to evict the files when space runs low; it may say no, which is fine.
  navigator.storage?.persist?.().catch(() => {});
  await tx("readwrite", (s) => s.put({ blob: file, name: file.name } satisfies StoredAudio, key));
  changed();
}

export async function deleteAudio(key: string) {
  await tx("readwrite", (s) => s.delete(key));
  changed();
}

export async function audioKeys(): Promise<Set<string>> {
  try {
    return new Set((await tx("readonly", (s) => s.getAllKeys())).map(String));
  } catch {
    return new Set();
  }
}

export function onAudioChange(fn: () => void) {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

/**
 * Matches file names like "03 - Linkin Park - With You.mp3" to tracks. An exact title wins; otherwise
 * the longest title contained in the name, so "Breaking the Habit" never lands on a shorter title.
 */
export function matchAudioFile(fileName: string, tracks: Track[]): Track | undefined {
  const base = normalizeTitle(
    fileName
      .replace(/\.[a-z0-9]{2,5}$/i, "")
      .replace(/linkin\s*park/gi, "")
      .replace(/^[\s\d._-]+/, ""),
  );
  if (!base) return undefined;
  const exact = tracks.find((t) => normalizeTitle(t.name) === base);
  if (exact) return exact;
  return tracks
    .filter((t) => base.includes(normalizeTitle(t.name)))
    .sort((a, b) => normalizeTitle(b.name).length - normalizeTitle(a.name).length)[0];
}
