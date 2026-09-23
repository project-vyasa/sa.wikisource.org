import { decodeEntities, normalizePara } from "../lib/html-text";
import { pad2, pad3 } from "../lib/devanagari-numerals";
import { isLatinGarbage } from "../lib/vedic-pua";
import {
  ExtractedAdhyayaSchema,
  type ExtractedAdhyaya,
  type ExtractedSutra,
} from "../schema/ttpr";

function stripWikiNoise(wikitext: string): string {
  return wikitext
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/'''?/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1");
}

const ADHYAYA_SPLIT = /==+\s*[^=]+?ध्यायः\s*==+/u;
const SUTRA_SPLIT = /\s+([०-९]+)/gu;
const COLOPHON = /इति\s+\S*?ध्यायः.*$/u;
const CHAPTER_OPEN = /^अथ\s+\S*?ध्यायः\s*/u;

export function parseAdhyayaSutras(chunk: string): ExtractedSutra[] {
  let text = stripWikiNoise(chunk);
  text = text.replace(CHAPTER_OPEN, "").replace(COLOPHON, "").trim();
  if (!text) return [];

  const matches = [...text.matchAll(SUTRA_SPLIT)];
  const sutras: ExtractedSutra[] = [];
  let cursor = 0;
  let n = 0;

  for (const m of matches) {
    const body = normalizePara(text.slice(cursor, m.index));
    cursor = m.index! + m[0].length;
    if (!body || isLatinGarbage(body)) continue;
    n += 1;
    sutras.push({
      sutra: pad3(n),
      mula_devanagari: body,
    });
  }

  return sutras;
}

export function parsePratisakhya(
  wikitext: string,
  sourceUrl: string,
): ExtractedAdhyaya[] {
  const text = decodeEntities(wikitext);
  const parts = text.split(ADHYAYA_SPLIT);
  const out: ExtractedAdhyaya[] = [];
  let adhyaya = 0;

  for (const part of parts) {
    const sutras = parseAdhyayaSutras(part);
    if (!sutras.length) continue;
    adhyaya += 1;
    out.push(
      ExtractedAdhyayaSchema.parse({
        source_url: sourceUrl,
        adhyaya: pad2(adhyaya),
        sutras,
      }),
    );
  }

  return out;
}
