import { cloudAudioKeys, deleteCloudAudio, downloadAudio, onCloudChange, uploadAudio } from "./cloud";

/**
 * Audio files the visitor picks from their own device, kept in this browser's IndexedDB under the
 * track key so they survive reloads. When signed in they are also uploaded to the account's private
 * storage (lib/cloud.ts), and on another computer they are downloaded the first time they play.
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

const getLocal = (key: string) => tx<StoredAudio | undefined>("readonly", (s) => s.get(key));
const putLocal = (key: string, a: StoredAudio) => tx("readwrite", (s) => s.put(a, key));

export async function getAudio(key: string): Promise<StoredAudio | undefined> {
  const local = await getLocal(key).catch(() => undefined);
  if (local) return local;
  const blob = await downloadAudio(key);
  if (!blob) return undefined;
  const a = { blob, name: key };
  await putLocal(key, a).catch(() => {});
  return a;
}

/** Local copies only, for the first upload after signing in. */
export const getLocalAudioBlob = async (key: string) => (await getLocal(key))?.blob;
export async function localAudioKeys(): Promise<Set<string>> {
  try {
    return new Set((await tx("readonly", (s) => s.getAllKeys())).map(String));
  } catch {
    return new Set();
  }
}

export async function saveAudio(key: string, file: File) {
  // Ask the browser not to evict the files when space runs low; it may say no, which is fine.
  navigator.storage?.persist?.().catch(() => {});
  await putLocal(key, { blob: file, name: file.name });
  changed();
  await uploadAudio(key, file).catch(() => {
    throw new Error("upload");
  });
}

export async function deleteAudio(key: string) {
  await tx("readwrite", (s) => s.delete(key));
  changed();
  await deleteCloudAudio(key);
}

/** Tracks with a file in this browser or in the account. */
export async function audioKeys(): Promise<Set<string>> {
  return new Set([...(await localAudioKeys()), ...cloudAudioKeys()]);
}

export function onAudioChange(fn: () => void) {
  window.addEventListener(EVENT, fn);
  const off = onCloudChange(fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    off();
  };
}

