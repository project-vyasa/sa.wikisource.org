import { decodeEntities, normalizePara } from "../lib/html-text";
import { devanagariToArabic, pad2 } from "../lib/devanagari-numerals";
import { isLatinGarbage } from "../lib/vedic-pua";

export interface JyotishaVerse {
  verse: number;
  body: string;
}

export interface JyotishaChapter {
  chapter: string;
  title: string;
  verses: JyotishaVerse[];
}

const SECTION_SPLIT = /==+\s*([^=\n]+?)\s*==+/gu;
const VERSE_DELIM = /॥([०-९0-9]+)॥/gu;

function stripWikiNoise(wikitext: string): string {
  return decodeEntities(wikitext)
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/'''?/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1");
}

function slugChapter(title: string): string {
  const t = title.trim();
  if (t.includes("आर्च")) return "archa";
  if (t.includes("याजुष")) return "yajusha";
  return t.replace(/\s+/g, "-").slice(0, 24) || "chapter";
}

/** Split on `॥n॥` after collapsing lines — text *before* each marker is one verse. */
export function parseVersesFromSectionBody(body: string): JyotishaVerse[] {
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return [];

  const byNum = new Map<number, string>();
  const markers: Array<{ n: number; start: number; end: number }> = [];
  for (const m of flat.matchAll(VERSE_DELIM)) {
    markers.push({ n: Number(devanagariToArabic(m[1]!)), start: m.index!, end: m.index! + m[0].length });
  }
  if (!markers.length) return [];

  let cursor = 0;
  for (const mk of markers) {
    const chunk = flat.slice(cursor, mk.start).trim();
    cursor = mk.end;
    if (!chunk || isLatinGarbage(chunk)) continue;
    const line = normalizePara(chunk);
    const prev = byNum.get(mk.n);
    byNum.set(mk.n, prev ? `${prev} ${line}` : line);
  }

  return [...byNum.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, body]) => ({ verse: n, body }));
}

export function parseVedangaJyotisha(wikitext: string): JyotishaChapter[] {
  const text = stripWikiNoise(wikitext);
  const out: JyotishaChapter[] = [];
  const parts = text.split(SECTION_SPLIT);

  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]!.trim();
    const body = parts[i + 1] ?? "";
    if (!title || title.includes("स्रोतः") || title.includes("पश्यतु")) continue;
    const chapter = slugChapter(title);
    const verses = parseVersesFromSectionBody(body);
    if (verses.length) {
      out.push({ chapter, title, verses });
    }
  }
  return out;
}

export function toExtractedChapter(ch: JyotishaChapter, sourceUrl: string, sourceFile: string) {
  return {
    source_url: sourceUrl,
    source_file: sourceFile,
    chapter: ch.chapter,
    title: ch.title,
    verses: ch.verses.map((v) => ({
      verse: pad2(v.verse),
      mula_devanagari: v.body,
    })),
  };
}
