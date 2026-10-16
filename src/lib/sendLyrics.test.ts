import { describe, expect, it } from "vitest";
import { allTracks } from "./albums";
import { bookmarkletHref, matchSent, parseSent } from "./sendLyrics";

const numb = allTracks.find((t) => t.name === "Numb")!;
const hash = (d: object) => "#" + encodeURIComponent(JSON.stringify(d));

/** Runs the bookmarklet against a fake page and returns where it navigated (or the alert it showed). */
function run(page: Record<string, string>, selection = "") {
  const code = decodeURIComponent(bookmarkletHref("https://example.com").slice("javascript:".length));
  const location = { href: "https://www.letras.com/linkin-park/34808/traduccion.html" };
  let alerted = "";
  const document = {
    title: "page title",
    querySelector: (s: string) => (s in page ? { innerText: page[s] } : null),
  };
  const window = { getSelection: () => selection };
  new Function("window", "document", "location", "alert", code)(window, document, location, (m: string) => {
    alerted = m;
  });
  return { href: location.href, alerted };
}

describe("bookmarklet", () => {
  it("is a javascript: URL", () => {
    expect(bookmarkletHref("https://example.com").startsWith("javascript:")).toBe(true);
  });
  it("sends both columns of the page to /recibir/", () => {
    const { href } = run({
      h1: "Numb",
      ".lyric-original": "I'm tired \n\n\n\nof being",
      ".lyric-translation": "Estoy cansado\n\nde ser",
    });
    expect(href.startsWith("https://example.com/recibir/#")).toBe(true);
    expect(parseSent(href.slice(href.indexOf("#")))).toEqual({
      url: "https://www.letras.com/linkin-park/34808/traduccion.html",
      title: "Numb",
      lyrics: { original: "I'm tired\n\nof being", traduccion: "Estoy cansado\n\nde ser" },
    });
  });
  it("uses the selection when there is one, split on ---", () => {
    const { href } = run({ ".lyric-original": "ignored" }, "uno\ndos\n---\none\ntwo");
    expect(parseSent(href.slice(href.indexOf("#")))?.lyrics).toEqual({ original: "uno\ndos", traduccion: "one\ntwo" });
  });
  it("asks for a selection when it finds nothing", () => {
    const r = run({});
    expect(r.alerted).toMatch(/Seleccioná/);
    expect(r.href).toContain("letras.com");
  });
});

describe("parseSent", () => {
  it("reads the bookmarklet payload", () => {
    const s = parseSent(hash({ v: 1, url: "u", title: "Numb", original: " a\nb ", traduccion: "x\ny" }));
    expect(s).toEqual({ url: "u", title: "Numb", lyrics: { original: "a\nb", traduccion: "x\ny" } });
  });
  it("rejects empty or malformed payloads", () => {
    expect(parseSent("")).toBeNull();
    expect(parseSent("#%7Bnope")).toBeNull();
    expect(parseSent(hash({ v: 1, original: "", traduccion: "" }))).toBeNull();
    expect(parseSent(hash({ v: 2, original: "a" }))).toBeNull();
  });
});

describe("matchSent", () => {
  it("matches the letras.com page id first", () => {
    const url = `${numb.letrasUrl}traduccion.html`;
    expect(matchSent({ url, title: "something else" }, allTracks)?.key).toBe(numb.key);
  });
  it("falls back to the page title", () => {
    expect(matchSent({ url: "https://other.site/x", title: "Numb - Linkin Park" }, allTracks)?.key).toBe(numb.key);
    expect(matchSent({ url: "", title: "Numb (Traducción)" }, allTracks)?.key).toBe(numb.key);
    expect(matchSent({ url: "", title: "Canción inventada" }, allTracks)).toBeUndefined();
  });
});
