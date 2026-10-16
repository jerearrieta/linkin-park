/**
 * Play queue, kept apart from the audio element so it can be tested on its own.
 * `items` is the list in album order; `order` is the play order (shuffled or not) as indexes into
 * `items`, and `pos` points into `order`. Shuffling only rewrites `order`, so turning it off returns
 * to album order from the current song.
 */
export type Repeat = "off" | "all" | "one";

export type Queue = { items: string[]; order: number[]; pos: number; shuffle: boolean; repeat: Repeat };

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Fisher–Yates shuffle that keeps `first` at the front, so the current song keeps playing. */
function shuffled(n: number, first: number, rand: () => number): number[] {
  const rest = range(n).filter((i) => i !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [first, ...rest];
}

export function createQueue(
  items: string[],
  start: string,
  opts: { shuffle?: boolean; repeat?: Repeat; rand?: () => number } = {},
): Queue {
  const first = Math.max(0, items.indexOf(start));
  const shuffle = opts.shuffle ?? false;
  return {
    items,
    order: shuffle ? shuffled(items.length, first, opts.rand ?? Math.random) : range(items.length),
    pos: shuffle ? 0 : first,
    shuffle,
    repeat: opts.repeat ?? "off",
  };
}

export const currentItem = (q: Queue): string | undefined => q.items[q.order[q.pos]];

/**
 * Next song. `auto` is true when the previous one ended by itself: only then does "repeat one" replay
 * it, because pressing "next" should always move on. Returns null at the end of the queue.
 */
export function nextQueue(q: Queue, auto = false): Queue | null {
  if (!q.items.length) return null;
  if (auto && q.repeat === "one") return q;
  if (q.pos + 1 < q.order.length) return { ...q, pos: q.pos + 1 };
  return q.repeat === "off" ? null : { ...q, pos: 0 };
}

/** Previous song, wrapping around only when repeat is on. Stays on the first song otherwise. */
export function prevQueue(q: Queue): Queue {
  if (q.pos > 0) return { ...q, pos: q.pos - 1 };
  return q.repeat === "off" ? q : { ...q, pos: q.order.length - 1 };
}

export function toggleShuffle(q: Queue, rand: () => number = Math.random): Queue {
  const at = q.order[q.pos];
  return q.shuffle
    ? { ...q, shuffle: false, order: range(q.items.length), pos: at }
    : { ...q, shuffle: true, order: shuffled(q.items.length, at, rand), pos: 0 };
}

export const cycleRepeat = (r: Repeat): Repeat => (r === "off" ? "all" : r === "all" ? "one" : "off");

