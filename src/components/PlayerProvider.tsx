"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { findByKey } from "@/lib/albums";
import { getAudio } from "@/lib/audioFiles";
import { createQueue, currentItem, cycleRepeat, nextQueue, prevQueue, toggleShuffle, type Queue, type Repeat } from "@/lib/queue";
import { getVolume, saveVolume } from "@/lib/storage";
import { PlayerBar } from "./PlayerBar";

/**
 * The site's own player. One <audio> element lives here, in the root layout, so music keeps
 * playing while the visitor moves between pages. It only plays files the visitor stored in this
 * browser (see lib/audioFiles.ts). See docs/reproductor-analisis.md for how it was designed.
 */
type PlayerState = {
  queue: Queue | null;
  current: string | undefined;
  playing: boolean;
  volume: number;
  error: string | null;
};

type PlayerActions = {
  /** Plays `keys` as a queue starting at `start`. Keys without a stored file must be left out. */
  playList: (keys: string[], start: string) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  close: () => void;
};

const StateContext = createContext<(PlayerState & PlayerActions) | null>(null);
const TimeContext = createContext({ time: 0, duration: 0 });

/** Restart the song instead of going back when it has played longer than this, like Spotify. */
const RESTART_AFTER = 3;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  // Bumped on every jump so replaying the same song (or "repeat one") reloads it.
  const [jump, setJump] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState({ time: 0, duration: 0 });
  const prefs = useRef<{ shuffle: boolean; repeat: Repeat }>({ shuffle: false, repeat: "off" });
  const current = queue ? currentItem(queue) : undefined;

  useEffect(() => {
    const v = getVolume();
    setVolumeState(v);
    if (audio.current) audio.current.volume = v;
  }, []);

  // Load the stored file whenever the song changes.
  useEffect(() => {
    const el = audio.current;
    if (!el || !current) return;
    let url: string | null = null;
    let cancelled = false;
    setError(null);
    getAudio(current)
      .then((stored) => {
        if (cancelled) return;
        if (!stored) throw new Error("missing");
        url = URL.createObjectURL(stored.blob);
        el.src = url;
        return el.play();
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // Browsers block autoplay until the visitor interacts; that is not an error worth showing.
        if (e instanceof DOMException && e.name === "NotAllowedError") return;
        setPlaying(false);
        setError(e instanceof Error && e.message === "missing" ? "No está el archivo de esta canción" : "No se pudo reproducir el archivo");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [current, jump]);

  // Mirrors `queue` so actions can read it without being recreated on every change.
  const queueRef = useRef(queue);
  const commit = useCallback((q: Queue | null) => {
    queueRef.current = q;
    setQueue(q);
  }, []);
  const goTo = useCallback(
    (q: Queue | null) => {
      if (!q) {
        audio.current?.pause();
        return;
      }
      commit(q);
      setJump((n) => n + 1);
    },
    [commit],
  );

  const actions = useMemo<PlayerActions>(
    () => ({
      playList: (keys, start) => goTo(keys.length ? createQueue(keys, start, prefs.current) : null),
      toggle: () => {
        const el = audio.current;
        if (!el?.src) return;
        if (el.paused) void el.play().catch(() => {});
        else el.pause();
      },
      next: () => queueRef.current && goTo(nextQueue(queueRef.current)),
      prev: () => {
        const el = audio.current;
        if (el && el.currentTime > RESTART_AFTER) {
          el.currentTime = 0;
          return;
        }
        if (queueRef.current) goTo(prevQueue(queueRef.current));
      },
      seek: (s) => {
        if (audio.current && Number.isFinite(s)) audio.current.currentTime = s;
      },
      setVolume: (v) => {
        if (audio.current) audio.current.volume = v;
        setVolumeState(v);
        saveVolume(v);
      },
      toggleShuffle: () => {
        prefs.current.shuffle = !prefs.current.shuffle;
        const q = queueRef.current;
        if (q) commit(toggleShuffle(q));
      },
      cycleRepeat: () => {
        prefs.current.repeat = cycleRepeat(prefs.current.repeat);
        const q = queueRef.current;
        if (q) commit({ ...q, repeat: prefs.current.repeat });
      },
      close: () => {
        const el = audio.current;
        el?.pause();
        el?.removeAttribute("src");
        el?.load();
        commit(null);
      },
    }),
    [goTo, commit],
  );

  function onEnded() {
    const q = queueRef.current && nextQueue(queueRef.current, true);
    if (q) goTo(q);
    else setPlaying(false);
  }

  // Lock screen, headphones and media keys.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", actions.toggle],
      ["pause", actions.toggle],
      ["previoustrack", actions.prev],
      ["nexttrack", actions.next],
      ["seekto", (d) => d.seekTime != null && actions.seek(d.seekTime)],
    ];
    for (const [a, h] of handlers) {
      try {
        ms.setActionHandler(a, h);
      } catch {}
    }
    return () => {
      for (const [a] of handlers) {
        try {
          ms.setActionHandler(a, null);
        } catch {}
      }
    };
  }, [actions]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const found = current ? findByKey(current) : undefined;
    navigator.mediaSession.metadata = found
      ? new MediaMetadata({ title: found.track.name, artist: "Linkin Park", album: found.album.title })
      : null;
  }, [current]);

  useEffect(() => {
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  const state = useMemo(
    () => ({ queue, current, playing, volume, error, ...actions }),
    [queue, current, playing, volume, error, actions],
  );

  return (
    <StateContext.Provider value={state}>
      <TimeContext.Provider value={time}>
        {children}
        <audio
          ref={audio}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={onEnded}
          onTimeUpdate={(e) => setTime({ time: e.currentTarget.currentTime, duration: e.currentTarget.duration || 0 })}
          onDurationChange={(e) => {
            const duration = e.currentTarget.duration || 0;
            setTime((t) => ({ ...t, duration }));
          }}
          onEmptied={() => setTime({ time: 0, duration: 0 })}
        />
        {queue && <PlayerBar />}
      </TimeContext.Provider>
    </StateContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("usePlayer needs <PlayerProvider>");
  return ctx;
}

/** Position and length of the current song; changes several times a second. */
export const usePlayerTime = () => useContext(TimeContext);
