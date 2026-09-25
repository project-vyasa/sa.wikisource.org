import { devanagariToArabic, pad2 } from "../lib/devanagari-numerals";
import { normalizePara } from "../lib/html-text";
import { cleanVedicDumpText, isLatinGarbage } from "../lib/vedic-pua";

/** `(१,१.१अ) text…` — comma separates kāṇḍa from prapāṭhaka·khaṇḍa·pada. */
const MARKER_LINE =
  /^\(([०-९0-9]+),([०-९0-9]+)\.([०-९0-9]+)([^\)]*)\)\s*(.*)$/u;

export interface GopathaSegment {
  kanda: number;
  prapathaka: number;
  kandika: number;
  pada: string;
  marker: string;
  body: string;
}

function cleanBody(text: string): string {
  return normalizePara(cleanVedicDumpText(text.replace(/<\/?[a-zA-Z][^>]*>/g, " ").trim()));
}

export function parseGopathaDump(wikitext: string): GopathaSegment[] {
  const out: GopathaSegment[] = [];
  for (const raw of wikitext.split(/\n/)) {
    const line = raw.replace(/<[^>]*>/g, "").trim();
    if (!line || line.startsWith("{{") || line.startsWith("|") || line.startsWith("[[वर्गः")) {
      continue;
    }
    const m = MARKER_LINE.exec(line);
    if (!m) continue;
    const body = cleanBody(m[5] ?? "");
    if (!body || isLatinGarbage(body)) continue;
    const kanda = Number(devanagariToArabic(m[1]!));
    const prapathaka = Number(devanagariToArabic(m[2]!));
    const kandika = Number(devanagariToArabic(m[3]!));
    const pada = (m[4] ?? "").trim();
    if (!Number.isFinite(kanda) || !Number.isFinite(prapathaka) || !Number.isFinite(kandika)) {
      continue;
    }
    out.push({
      kanda,
      prapathaka,
      kandika,
      pada,
      marker: `(${m[1]},${m[2]}.${m[3]}${m[4]})`,
      body,
    });
  }
  return out;
}

export function unitKey(seg: GopathaSegment): string {
  return `${pad2(seg.kanda)}-${pad2(seg.prapathaka)}-${pad2(seg.kandika)}`;
}
