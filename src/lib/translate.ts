import type { Lyrics } from "./types";

/** Translates a list of lines, returning one Spanish line per input line. */
export type BatchTranslate = (lines: string[]) => Promise<string[]>;

/**
 * Fills the Spanish column line by line, keeping every line the visitor already wrote.
 * Lines are translated one for one so both columns stay aligned; repeated lines
 * (choruses) are translated once.
 */
export async function fillTranslation(l: Lyrics, translate: BatchTranslate): Promise<Lyrics> {
  const o = l.original.split("\n");
  const t = l.traduccion.split("\n");
  const n = Math.max(o.length, t.length);
  const needs = (i: number) => !!(o[i] ?? "").trim() && !(t[i] ?? "").trim();
  const todo = [...new Set(Array.from({ length: n }, (_, i) => i).filter(needs).map((i) => o[i].trim()))];
  const done = new Map<string, string>();
  if (todo.length) {
    const out = await translate(todo);
    todo.forEach((src, i) => done.set(src, out[i] ?? ""));
  }
  const lines = Array.from({ length: n }, (_, i) => (needs(i) ? done.get(o[i].trim())! : (t[i] ?? "")));
  return { original: l.original, traduccion: lines.join("\n").replace(/\s+$/, "") };
}

/** True when some original line has nothing next to it in the Spanish column. */
export function missingTranslation(l: Lyrics): boolean {
  const t = l.traduccion.split("\n");
  return l.original.split("\n").some((line, i) => line.trim() && !t[i]?.trim());
}

// Chrome's built-in, on-device Translator API (Chrome 138+ on desktop). Not in TypeScript's DOM types yet.
type TranslatorStatic = {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(o: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (m: EventTarget) => void;
  }): Promise<{ translate(text: string): Promise<string> }>;
};
const api = () => (globalThis as { Translator?: TranslatorStatic }).Translator;
const pair = { sourceLanguage: "en", targetLanguage: "es" };

async function chromeTranslator(allowDownload: boolean, onProgress?: (f: number) => void): Promise<BatchTranslate | null> {
  try {
    const a = await api()?.availability(pair);
    if (a !== "available" && !(allowDownload && (a === "downloadable" || a === "downloading"))) return null;
    const t = await api()!.create({
      ...pair,
      monitor: (m) => m.addEventListener("downloadprogress", (e) => onProgress?.((e as ProgressEvent).loaded)),
    });
    return async (lines) => {
      const out: string[] = [];
      for (const l of lines) out.push(await t.translate(l));
      return out;
    };
  } catch {
    return null;
  }
}

/** Online fallback for any browser: Google Translate's public endpoint, a block of lines per request. */
export const onlineTranslate: BatchTranslate = async (lines) => {
  const out: string[] = [];
  for (let i = 0; i < lines.length; ) {
    const chunk: string[] = [];
    while (i < lines.length && (chunk.length === 0 || chunk.join("\n").length + lines[i].length < 1500)) chunk.push(lines[i++]);
    const translated = await googleChunk(chunk);
    // Google can merge or split lines; if the count doesn't match, go line by line.
    if (translated.length === chunk.length) out.push(...translated);
    else for (const l of chunk) out.push((await googleChunk([l])).join(" "));
  }
  return out;
};

async function googleChunk(lines: string[]): Promise<string[]> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(lines.join("\n"))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate ${res.status}`);
  const data = (await res.json()) as [[string, string][]];
  return data[0]
    .map((s) => s[0])
    .join("")
    .split("\n")
    .map((s) => s.trim());
}

/**
 * The best translator this browser has: Chrome's on-device one when its model is ready
 * (or may be downloaded, which needs a click), otherwise the online one.
 */
export async function getTranslator(allowDownload = false, onProgress?: (f: number) => void): Promise<BatchTranslate> {
  return (await chromeTranslator(allowDownload, onProgress)) ?? onlineTranslate;
}

/** Last resort link: Google Translate with the original already pasted in. */
export const googleTranslateUrl = (text: string) =>
  `https://translate.google.com/?sl=en&tl=es&op=translate&text=${encodeURIComponent(text)}`;
