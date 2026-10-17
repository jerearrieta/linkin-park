import type { Lyrics } from "./types";

/**
 * Fills the Spanish column line by line, keeping every line the visitor already wrote.
 * Each original line is translated on its own so both columns stay aligned; repeated
 * lines (choruses) are translated once.
 */
export async function fillTranslation(l: Lyrics, translate: (line: string) => Promise<string>): Promise<Lyrics> {
  const o = l.original.split("\n");
  const t = l.traduccion.split("\n");
  const cache = new Map<string, Promise<string>>();
  const out: string[] = [];
  for (let i = 0; i < Math.max(o.length, t.length); i++) {
    const src = (o[i] ?? "").trim();
    const mine = t[i] ?? "";
    if (mine.trim() || !src) {
      out.push(mine);
      continue;
    }
    if (!cache.has(src)) cache.set(src, translate(src));
    out.push(await cache.get(src)!);
  }
  return { original: l.original, traduccion: out.join("\n").replace(/\s+$/, "") };
}

/** True when some original line has nothing next to it in the Spanish column. */
export function missingTranslation(l: Lyrics): boolean {
  const t = l.traduccion.split("\n");
  return l.original.split("\n").some((line, i) => line.trim() && !t[i]?.trim());
}

// Chrome's built-in, on-device Translator API (Chrome 138+ on desktop). Not in TypeScript's DOM types yet.
type TranslatorInstance = { translate(text: string): Promise<string> };
type TranslatorStatic = {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(o: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (m: EventTarget) => void;
  }): Promise<TranslatorInstance>;
};
const api = () => (globalThis as { Translator?: TranslatorStatic }).Translator;

/** Whether this browser can translate English to Spanish on its own. */
export async function canTranslate(): Promise<boolean> {
  try {
    const a = await api()?.availability({ sourceLanguage: "en", targetLanguage: "es" });
    return !!a && a !== "unavailable";
  } catch {
    return false;
  }
}

/** Must be called from a click: the first use downloads the English→Spanish model. */
export async function createTranslator(onProgress?: (fraction: number) => void) {
  const t = await api()!.create({
    sourceLanguage: "en",
    targetLanguage: "es",
    monitor: (m) =>
      m.addEventListener("downloadprogress", (e) => onProgress?.((e as ProgressEvent).loaded)),
  });
  return (line: string) => t.translate(line);
}

/** Fallback for other browsers: Google Translate with the original already pasted in. */
export const googleTranslateUrl = (text: string) =>
  `https://translate.google.com/?sl=en&tl=es&op=translate&text=${encodeURIComponent(text)}`;
