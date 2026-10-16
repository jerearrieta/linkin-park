import { describe, expect, it } from "vitest";
import { getAlbum } from "./albums";
import { matchAudioFile } from "./audioFiles";

const meteora = getAlbum("meteora")!.tracks;
const ht = getAlbum("hybrid-theory")!.tracks;

describe("matchAudioFile", () => {
  it("ignores track numbers, the band name, extensions and tags in parentheses", () => {
    expect(matchAudioFile("13 - Numb.mp3", meteora)?.key).toBe("met-13");
    expect(matchAudioFile("Linkin Park - Numb (Official Audio).m4a", meteora)?.key).toBe("met-13");
    expect(matchAudioFile("08. In The End.flac", ht)?.key).toBe("ht-8");
  });
  it("prefers the longest title contained in the name", () => {
    expect(matchAudioFile("linkin_park_breaking_the_habit_live.mp3", meteora)?.name).toBe("Breaking the Habit");
  });
  it("returns undefined when nothing matches", () => {
    expect(matchAudioFile("podcast.mp3", meteora)).toBeUndefined();
    expect(matchAudioFile("01.mp3", meteora)).toBeUndefined();
  });
});
