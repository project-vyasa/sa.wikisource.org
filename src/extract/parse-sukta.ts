import * as cheerio from "cheerio";
import {
  extractMeterFromProse,
  isGarbageChandas,
  isVerseNumberToken,
  normalizeChandasLabel,
  stripChandasNoise,
} from "../lib/anukramani";
import {
  type ExtractedRik,
  type ExtractedSukta,
  ExtractedSuktaSchema,
  pad2,
  pad3,
} from "../schema/rigveda";

export interface ParseSuktaOptions {
  html: string;
  sourceFile: string;
  sourceUrl: string;
  mandala: number;
  sukta: number;
}

const VEDIC_ACCENT = /[\u0951\u0952]/;
const VERSE_END = /॥\s*([०-९0-9]+)\s*॥?\s*$/;
const SAYANA_HDR = /सायणभाष्यम्/;
const SUKTA_NAV = /^सूक्तं\s+[०-९0-9]+(?:\.[०-९0-9]+)?$/u;
const DEV_TO_ARABIC: Record<string, string> = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

function devanagariToArabic(str: string): string {
  return str.replace(/[०-९]/g, (ch) => DEV_TO_ARABIC[ch] ?? ch);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizePara(text: string): string {
  return decodeEntities(text)
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function isStopPara(text: string): boolean {
  return (
    text.includes("टिप्पणी") ||
    text.includes("wordpress.com") ||
    /^https?:\/\//i.test(text)
  );
}

function isSayanaHeader(text: string): boolean {
  return SAYANA_HDR.test(text) && text.length < 40;
}

/** Mandala sukta index line from Wikisource toc sidebar (not commentary). */
function isSuktaNavPara(text: string): boolean {
  const line = text.trim();
  return line.length > 0 && line.length < 32 && SUKTA_NAV.test(line);
}

/** Padapatha: several short tokens separated by danda. */
export function isPadapatha(text: string): boolean {
  const parts = text
    .split(/।+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return false;
  const short = parts.filter((p) => p.replace(/\s+/g, "").length <= 28).length;
  return short / parts.length >= 0.7;
}

export function isSamhitaAccented(text: string): boolean {
  return VEDIC_ACCENT.test(text) && !isPadapatha(text);
}

function extractVerseNumber(text: string): number | null {
  const m = VERSE_END.exec(text.replace(/\n/g, " ").trim());
  if (!m) return null;
  const n = Number.parseInt(devanagariToArabic(m[1]), 10);
  return Number.isFinite(n) ? n : null;
}

function extractParagraphs(html: string): string[] {
  const $ = cheerio.load(html);
  const root = $(".mw-parser-output").length
    ? $(".mw-parser-output")
    : $("#mw-content-text");

  // Mandala sukta navigation table — not part of the text stream.
  root.find("table.toccolours").remove();

  const paras: string[] = [];
  root.find("p").each((_, el) => {
    const clone = $(el).clone();
    clone.find("script, style").remove();
    clone.find("br").replaceWith("\n");
    const text = normalizePara(clone.text());
    if (text) paras.push(text);
  });
  return paras;
}

function extractRishi(html: string): string | null {
  const $ = cheerio.load(html);
  const author = $("#ws-author").first().text().trim();
  return author || null;
}

/** Wikisource anukramani row: `दे. अग्निः। गायत्री` */
function extractAnukramaniTable(html: string): {
  devata: string | null;
  chandas: string | null;
} {
  const $ = cheerio.load(html);
  const cell = $("td")
    .filter((_, el) => /दे\./u.test($(el).text()))
    .first();
  if (!cell.length) return { devata: null, chandas: null };

  const text = normalizePara(cell.text());
  const deMatch = /दे\.\s*([^।]+)/u.exec(text);
  if (!deMatch) return { devata: null, chandas: null };

  const devata = deMatch[1].trim() || null;
  const afterDe = text.slice(deMatch.index! + deMatch[0].length);
  const chMatch = /[।\s]*([^\s।]+)/u.exec(afterDe);
  let chandas: string | null = null;
  const rawChandas = chMatch?.[1]?.trim() || null;
  if (rawChandas) {
    const cleaned = stripChandasNoise(rawChandas);
    chandas = normalizeChandasLabel(cleaned);
    if (isVerseNumberToken(cleaned) || isGarbageChandas(chandas)) {
      chandas = extractMeterFromProse(text);
    }
  }

  return { devata, chandas };
}

function guessChandas(intro: string): string | null {
  return extractMeterFromProse(intro);
}

export function parseSuktaHtml(opts: ParseSuktaOptions): ExtractedSukta {
  const { html, sourceFile, sourceUrl, mandala, sukta } = opts;
  const paras = extractParagraphs(html);
  const rishi = extractRishi(html);
  const tableMeta = extractAnukramaniTable(html);

  const sayanaIdx = paras.findIndex(isSayanaHeader);

  let i = sayanaIdx >= 0 ? sayanaIdx + 1 : 0;
  const introParts: string[] = [];
  while (i < paras.length && !isSamhitaAccented(paras[i])) {
    if (!isSayanaHeader(paras[i]) && !isStopPara(paras[i])) {
      introParts.push(paras[i]);
    }
    i += 1;
  }
  const introduction = introParts.join("\n").trim() || null;

  const riks: ExtractedRik[] = [];
  while (i < paras.length) {
    if (isStopPara(paras[i]) || isSuktaNavPara(paras[i])) break;
    if (!isSamhitaAccented(paras[i])) {
      i += 1;
      continue;
    }

    const samhitaLines: string[] = [];
    while (i < paras.length && isSamhitaAccented(paras[i])) {
      samhitaLines.push(paras[i]);
      i += 1;
    }

    const padaAcc: string[] = [];
    while (
      i < paras.length &&
      isPadapatha(paras[i]) &&
      VEDIC_ACCENT.test(paras[i])
    ) {
      padaAcc.push(paras[i]);
      i += 1;
    }

    const pada: string[] = [];
    while (
      i < paras.length &&
      isPadapatha(paras[i]) &&
      !VEDIC_ACCENT.test(paras[i])
    ) {
      pada.push(paras[i]);
      i += 1;
    }

    const sayanaParts: string[] = [];
    while (i < paras.length && !isSamhitaAccented(paras[i])) {
      if (isStopPara(paras[i]) || isSuktaNavPara(paras[i])) break;
      if (!isSayanaHeader(paras[i])) sayanaParts.push(paras[i]);
      i += 1;
    }

    const samhita = samhitaLines.join("\n").trim();
    const n =
      extractVerseNumber(samhita) ??
      (riks.length > 0
        ? Number.parseInt(riks[riks.length - 1].rik, 10) + 1
        : 1);

    const padapatha =
      padaAcc.join("\n").trim() || pada.join("\n").trim() || null;

    riks.push({
      rik: pad2(n),
      samhita_devanagari: samhita,
      padapatha_devanagari: padapatha,
      sayanacharya_bhashya: sayanaParts.join("\n").trim() || null,
    });
  }

  if (riks.length === 0) {
    throw new Error(`No riks parsed from ${sourceFile}`);
  }

  return ExtractedSuktaSchema.parse({
    source_url: sourceUrl,
    source_file: sourceFile,
    mandala: pad2(mandala),
    sukta: pad3(sukta),
    anukramani: {
      rishi,
      devata: tableMeta.devata,
      chandas:
        tableMeta.chandas ??
        (introduction ? guessChandas(introduction) : null),
      introduction,
    },
    riks,
  });
}
