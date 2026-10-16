import { describe, expect, it } from "vitest";
import { allTracks, albums } from "./albums";
import { findTrack, lyricsTemplate, pairLines, parseLyricsFile } from "./importLyrics";

describe("findTrack", () => {
  it("matches titles ignoring case, accents, punctuation and parentheses", () => {
    expect(findTrack("what ive done", allTracks)?.key).toBe("mtm-6");
    expect(findTrack("From Zero", allTracks)?.key).toBe("fz-1");
    expect(findTrack("FIGURE 09", allTracks)?.key).toBe("met-8");
  });
  it("matches track keys", () => {
    expect(findTrack("met-13", allTracks)?.name).toBe("Numb");
  });
  it("returns undefined for unknown songs", () => {
    expect(findTrack("Canción inventada", allTracks)).toBeUndefined();
  });
});

describe("parseLyricsFile", () => {
  it("splits each song into original and translation", () => {
    const file = "# comentario\n## Numb\nline one\n\nline two\n---\nlínea uno\n\nlínea dos\n\n## Nope\nx\n---\ny\n";
    const [numb, nope] = parseLyricsFile(file, allTracks);
    expect(numb.track?.key).toBe("met-13");
    expect(numb.lyrics).toEqual({ original: "line one\n\nline two", traduccion: "línea uno\n\nlínea dos" });
    expect(nope.track).toBeUndefined();
  });
  it("leaves template entries empty", () => {
    const parsed = parseLyricsFile(lyricsTemplate(albums), allTracks);
    expect(parsed).toHaveLength(allTracks.length);
    expect(parsed.every((p) => p.track && !p.lyrics.original && !p.lyrics.traduccion)).toBe(true);
  });
});

describe("pairLines", () => {
  it("aligns lines by position and marks stanza gaps", () => {
    expect(pairLines({ original: "a\n\nb", traduccion: "x\n\ny\nz" })).toEqual([
      { original: "a", traduccion: "x" },
      null,
      { original: "b", traduccion: "y" },
      { original: "", traduccion: "z" },
    ]);
  });
});
