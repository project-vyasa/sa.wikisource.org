import { decodeEntities, normalizePara } from "../lib/html-text";
import { devanagariToArabic, pad2, pad3 } from "../lib/devanagari-numerals";
import {
  ExtractedMaheshvaraSchema,
  ExtractedPadaSchema,
  type ExtractedMaheshvara,
  type ExtractedPada,
  type ExtractedSutra,
} from "../schema/aady";

const MULA_ID_SRC = "([०-९]+)\\.([०-९]+)\\.([०-९]+)";
const VYAKHYA_ID_SRC = "\\[([०-९]+)\\|([०-९]+)\\|([०-९]+)\\]";

export function readWikitextFromParseJson(raw: string): string {
  const parsed = JSON.parse(raw) as {
    parse?: { wikitext?: string };
    error?: { info?: string };
  };
  if (parsed.error?.info) {
    throw new Error(`MediaWiki parse error: ${parsed.error.info}`);
  }
  const text = parsed.parse?.wikitext;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Missing parse.wikitext in cached MediaWiki JSON");
  }
  return decodeEntities(text);
}

function stripWikiNoise(wikitext: string): string {
  return wikitext
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/'''?/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1");
}

function compactMula(text: string): string {
  return normalizePara(text)
    .replace(/[।॥]+\s*$/u, "")
    .replace(/\s+/g, "")
    .replace(/=/g, "");
}

export function parseMulaAdhyaya(wikitext: string): Map<string, string> {
  const text = stripWikiNoise(wikitext);
  const matches = [...text.matchAll(new RegExp(MULA_ID_SRC, "gu"))];
  const out = new Map<string, string>();

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]!;
    const adhyaya = Number(devanagariToArabic(m[1]!));
    const pada = Number(devanagariToArabic(m[2]!));
    const sutra = Number(devanagariToArabic(m[3]!));
    if (!adhyaya || !pada || !sutra) continue;

    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : text.length;
    const body = normalizePara(text.slice(start, end));
    if (!body) continue;

    const key = `${pad2(adhyaya)}.${pad2(pada)}.${pad3(sutra)}`;
    out.set(key, body);
  }
  return out;
}

export function parseVyakhyaAdhyaya(
  wikitext: string,
): Map<string, { rest: string }> {
  const text = stripWikiNoise(wikitext);
  const matches = [...text.matchAll(new RegExp(VYAKHYA_ID_SRC, "gu"))];
  const out = new Map<string, { rest: string }>();

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]!;
    const adhyaya = Number(devanagariToArabic(m[1]!));
    const pada = Number(devanagariToArabic(m[2]!));
    const sutra = Number(devanagariToArabic(m[3]!));
    if (!adhyaya || !pada || !sutra) continue;

    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : text.length;
    const rest = normalizePara(text.slice(start, end));
    const key = `${pad2(adhyaya)}.${pad2(pada)}.${pad3(sutra)}`;
    out.set(key, { rest });
  }
  return out;
}

function splitVyakhya(
  rest: string,
  mula: string,
): { vyakhya: string | null; udaharana: string | null } {
  let body = rest.trim();
  const compactBody = compactMula(body);
  const compactM = compactMula(mula);
  if (compactM && compactBody.startsWith(compactM)) {
    let consumed = 0;
    let seen = 0;
    while (consumed < body.length && seen < compactM.length) {
      const ch = body[consumed]!;
      if (/\s|[।॥=]/u.test(ch)) {
        consumed += 1;
        continue;
      }
      seen += 1;
      consumed += 1;
    }
    body = body.slice(consumed).trim();
  }

  const pipe = body.indexOf("|");
  if (pipe >= 0) {
    const vyakhya = body.slice(0, pipe).trim() || null;
    const udaharana = body.slice(pipe + 1).trim() || null;
    return { vyakhya, udaharana };
  }
  return { vyakhya: body || null, udaharana: null };
}

export function alignPada(opts: {
  adhyaya: number;
  pada: number;
  mula: Map<string, string>;
  vyakhya: Map<string, { rest: string }>;
  sourceUrls: { mula: string; vyakhya: string };
}): { pada: ExtractedPada; unmatchedVyakhya: string[]; missingVyakhya: string[] } {
  const aa = pad2(opts.adhyaya);
  const pp = pad2(opts.pada);
  const prefix = `${aa}.${pp}.`;

  const mulaKeys = [...opts.mula.keys()].filter((k) => k.startsWith(prefix)).sort();
  const vyakhyaKeys = [...opts.vyakhya.keys()].filter((k) => k.startsWith(prefix));

  const unmatchedVyakhya = vyakhyaKeys.filter((k) => !opts.mula.has(k)).sort();
  const missingVyakhya: string[] = [];
  const sutras: ExtractedSutra[] = [];

  for (const key of mulaKeys) {
    const mula = opts.mula.get(key)!;
    const v = opts.vyakhya.get(key);
    if (!v) missingVyakhya.push(key);
    const split = v ? splitVyakhya(v.rest, mula) : { vyakhya: null, udaharana: null };
    sutras.push({
      sutra: key.slice(-3),
      mula_devanagari: mula,
      vyakhya_hindi: split.vyakhya,
      udaharana: split.udaharana,
    });
  }

  const pada = ExtractedPadaSchema.parse({
    source_urls: opts.sourceUrls,
    adhyaya: aa,
    pada: pp,
    sutras,
  });

  return { pada, unmatchedVyakhya, missingVyakhya };
}

export function parseMaheshvaraFromMula(
  wikitext: string,
  sourceUrl: string,
): ExtractedMaheshvara {
  const section = /==\s*प्रत्याहार सूत्र\s*==([\s\S]*?)(?=\n==|$)/u.exec(wikitext);
  const chunk = section?.[1] ?? wikitext;
  return parseMaheshvaraWikitext(chunk, sourceUrl);
}

export function parseMaheshvaraWikitext(
  wikitext: string,
  sourceUrl: string,
): ExtractedMaheshvara {
  const text = stripWikiNoise(wikitext);
  const tokens = text
    .split(/[।॥]+/u)
    .map((t) => normalizePara(t))
    .filter((t) => t.length >= 2 && /[क-ह]/u.test(t));

  const sutras = tokens.slice(0, 14).map((text, i) => ({ n: i + 1, text }));
  return ExtractedMaheshvaraSchema.parse({ source_url: sourceUrl, sutras });
}
