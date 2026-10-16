"use client";

import { useSyncExternalStore } from "react";
import { audioKeys, onAudioChange } from "./audioFiles";

// One shared copy of the stored keys, so a list of badges reads IndexedDB once, not once per badge.
const EMPTY = new Set<string>();
let keys = EMPTY;
let listeners = 0;
let off: (() => void) | null = null;
const subscribers = new Set<() => void>();

const refresh = () =>
  void audioKeys().then((k) => {
    keys = k;
    subscribers.forEach((fn) => fn());
  });

function subscribe(fn: () => void) {
  subscribers.add(fn);
  if (listeners++ === 0) {
    off = onAudioChange(refresh);
    refresh();
  }
  return () => {
    subscribers.delete(fn);
    if (--listeners === 0) off?.();
  };
}

/** Keys of the tracks that have an audio file stored in this browser; empty until loaded. */
export const useAudioKeys = (): Set<string> => useSyncExternalStore(subscribe, () => keys, () => EMPTY);
