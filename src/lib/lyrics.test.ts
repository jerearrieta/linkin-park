import { describe, expect, it } from "vitest";
import { pairLines } from "./lyrics";
import { fillTranslation, missingTranslation } from "./translate";

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

describe("fillTranslation", () => {
  it("translates only empty lines, keeps stanza gaps and translates repeats once", async () => {
    const calls: string[] = [];
    const tr = async (s: string) => (calls.push(s), s.toUpperCase());
    const out = await fillTranslation({ original: "a\nb\n\na\nc", traduccion: "mía" }, tr);
    expect(out.traduccion).toBe("mía\nB\n\nA\nC");
    expect(calls).toEqual(["b", "a", "c"]);
  });

  it("detects missing lines", () => {
    expect(missingTranslation({ original: "a\n\nb", traduccion: "x\n\ny" })).toBe(false);
    expect(missingTranslation({ original: "a\n\nb", traduccion: "x" })).toBe(true);
  });
});
