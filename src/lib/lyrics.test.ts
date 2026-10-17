import { describe, expect, it } from "vitest";
import { pairLines } from "./lyrics";

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
