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

