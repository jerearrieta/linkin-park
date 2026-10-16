import { describe, expect, it } from "vitest";
import { createQueue, currentItem, cycleRepeat, nextQueue, prevQueue, toggleShuffle } from "./queue";

const items = ["a", "b", "c", "d"];
// Deterministic "random": always picks the first slot, which reverses the rest.
const rand = () => 0;

describe("queue", () => {
  it("starts at the chosen song and moves in album order", () => {
    let q = createQueue(items, "b");
    expect(currentItem(q)).toBe("b");
    q = nextQueue(q)!;
    expect(currentItem(q)).toBe("c");
    expect(currentItem(prevQueue(q))).toBe("b");
  });

  it("stops at the end unless repeat all is on", () => {
    const end = createQueue(items, "d");
    expect(nextQueue(end)).toBeNull();
    expect(currentItem(nextQueue({ ...end, repeat: "all" })!)).toBe("a");
    expect(currentItem(prevQueue(createQueue(items, "a")))).toBe("a");
    expect(currentItem(prevQueue({ ...createQueue(items, "a"), repeat: "all" }))).toBe("d");
  });

  it("repeats one song only when it ends by itself", () => {
    const q = { ...createQueue(items, "b"), repeat: "one" as const };
    expect(currentItem(nextQueue(q, true)!)).toBe("b");
    expect(currentItem(nextQueue(q)!)).toBe("c");
  });

  it("shuffles the rest keeping the current song, and unshuffles back to album order", () => {
    let q = createQueue(items, "b");
    q = toggleShuffle(q, rand);
    expect(currentItem(q)).toBe("b");
    expect(q.order).toHaveLength(4);
    expect(new Set(q.order)).toEqual(new Set([0, 1, 2, 3]));
    q = nextQueue(q)!;
    const playing = currentItem(q);
    q = toggleShuffle(q);
    expect(currentItem(q)).toBe(playing);
    expect(q.order).toEqual([0, 1, 2, 3]);
  });

  it("starts shuffled with the chosen song first", () => {
    const q = createQueue(items, "c", { shuffle: true, rand });
    expect(q.pos).toBe(0);
    expect(currentItem(q)).toBe("c");
  });

  it("cycles repeat off → all → one → off", () => {
    expect([cycleRepeat("off"), cycleRepeat("all"), cycleRepeat("one")]).toEqual(["all", "one", "off"]);
  });
});
