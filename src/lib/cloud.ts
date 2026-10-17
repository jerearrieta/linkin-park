import { createClient, type Session } from "@supabase/supabase-js";
import { allTracks } from "./albums";
import type { Lyrics } from "./types";

/**
 * The owner's private copy in Supabase (project "linkin-park"): lyrics in the `lyrics` table and
 * audio files in the private `audio` bucket under "<user id>/<track key>". Row-level security lets
 * each signed-in account read and write only its own rows and files. The browser stores stay as a
 * cache, so the site keeps working signed out or offline.
 */
const SUPABASE_URL = "https://fiumdxmfxvfeotleiyoy.supabase.co";
// Publishable key: safe to ship in the page, everything it can reach is behind row-level security.
const KEY = "sb_publishable_hUOgaVoPOoNszbsUGVlN0Q_HuPGPOkN";

export const supabase = createClient(SUPABASE_URL, KEY);

const EVENT = "lp-cloud";
let session: Session | null = null;
const changed = () => window.dispatchEvent(new Event(EVENT));

export const currentUser = () => session?.user ?? null;
export function onCloudChange(fn: () => void) {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

// ---- Lyrics ----

export async function pushLyrics(trackKey: string, l: Lyrics) {
  if (!session) return;
  const { error } = await supabase
    .from("lyrics")
    .upsert({ track_key: trackKey, original: l.original, traduccion: l.traduccion, updated_at: new Date().toISOString() });
  if (error) console.error("lyrics upload", error);
}

export async function removeCloudLyrics(trackKey: string) {
  if (!session) return;
  await supabase.from("lyrics").delete().eq("track_key", trackKey);
}

/**
 * Brings the account's lyrics into this browser (the cloud copy wins) and uploads the ones only
 * this browser has, so lyrics typed before signing in are not lost.
 */
async function syncLyrics(readLocal: (k: string) => Lyrics | null, writeLocal: (k: string, l: Lyrics) => void) {
  const { data, error } = await supabase.from("lyrics").select("track_key, original, traduccion");
  if (error) throw error;
  const cloud = new Map(data.map((r) => [r.track_key as string, r as Lyrics & { track_key: string }]));
  for (const t of allTracks) {
    const remote = cloud.get(t.key);
    const local = readLocal(t.key);
    if (remote) {
      if (!local || local.original !== remote.original || local.traduccion !== remote.traduccion)
        writeLocal(t.key, { original: remote.original, traduccion: remote.traduccion });
    } else if (local) await pushLyrics(t.key, local);
  }
}

// ---- Audio ----

const path = (trackKey: string) => `${session!.user.id}/${trackKey}`;
let cloudAudio = new Set<string>();
export const cloudAudioKeys = () => cloudAudio;

export async function uploadAudio(trackKey: string, file: Blob) {
  if (!session) return;
  const { error } = await supabase.storage
    .from("audio")
    .upload(path(trackKey), file, { upsert: true, contentType: file.type || "audio/mpeg" });
  if (error) throw error;
  cloudAudio = new Set(cloudAudio).add(trackKey);
  changed();
}

export async function deleteCloudAudio(trackKey: string) {
  if (!session) return;
  await supabase.storage.from("audio").remove([path(trackKey)]);
  cloudAudio = new Set(cloudAudio);
  cloudAudio.delete(trackKey);
  changed();
}

export async function downloadAudio(trackKey: string): Promise<Blob | null> {
  if (!session || !cloudAudio.has(trackKey)) return null;
  const { data, error } = await supabase.storage.from("audio").download(path(trackKey));
  return error ? null : data;
}

async function syncAudio(localKeys: () => Promise<Set<string>>, readLocal: (k: string) => Promise<Blob | undefined>) {
  const { data, error } = await supabase.storage.from("audio").list(session!.user.id, { limit: 1000 });
  if (error) throw error;
  cloudAudio = new Set(data.map((f) => f.name));
  changed();
  // Files picked in this browser before signing in go up once.
  for (const k of await localKeys()) {
    if (cloudAudio.has(k)) continue;
    const blob = await readLocal(k);
    if (blob) await uploadAudio(k, blob).catch((e) => console.error("audio upload", k, e));
  }
}

// ---- Session ----

type Local = {
  readLyrics: (k: string) => Lyrics | null;
  writeLyrics: (k: string, l: Lyrics) => void;
  audioKeys: () => Promise<Set<string>>;
  readAudio: (k: string) => Promise<Blob | undefined>;
};

export let syncing: Promise<void> | null = null;

/** Starts following the sign-in state; each sign-in syncs this browser with the account. */
export function startCloud(local: Local) {
  const run = () => {
    syncing = (async () => {
      await syncLyrics(local.readLyrics, local.writeLyrics);
      await syncAudio(local.audioKeys, local.readAudio);
    })().catch((e) => console.error("sync", e));
    syncing.finally(changed);
  };
  supabase.auth.onAuthStateChange((event, s) => {
    const was = session?.user.id;
    session = s;
    if (!s) cloudAudio = new Set();
    if (s && s.user.id !== was) setTimeout(run);
    changed();
  });
}
