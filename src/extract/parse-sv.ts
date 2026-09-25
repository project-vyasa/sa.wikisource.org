import { normalizePara } from "../lib/html-text";
import { devanagariToArabic, pad2 } from "../lib/devanagari-numerals";
import { cleanVedicDumpText, isLatinGarbage } from "../lib/vedic-pua";
import {
  ExtractedSegmentSchema,
  type ExtractedMantra,
  formatMantraId,
  type ExtractedSegment,
} from "../schema/sv";
import { readWikitextFromParseJson } from "./parse-tts";

export { readWikitextFromParseJson };

const PURVA_HEADER =
  /^पूर्वार्चिकः\/[^/]+\/(\d+)\.(\d+)\.(\d+)\s+[^/]+\/(\d+)\.(\d+)\.(\d+)\.(\d+)\s+/;
const UTTARA_RANGE = /^(\d+)\.(\d+)\.(\d+)\s*\(/;
const STOBHA = /^\[धा\./;
const SKIP_LINE = /^\[\[|^\[\[वर्गः|^https?:\/\//;
const MANTRA_MARKER_FULL = /(.+?)।।\s*([०-९0-9]+)\s*।।/g;
const MANTRA_MARKER_TAIL = /^(.+?)।।\s*([०-९0-9]+)\s*$/;

export interface SvLocation {
  arcika: number;
  prapāṭhaka: number;
  segment: number;
  segmentKind: "dasati" | "ardha";
  header: string | null;
}

export interface SvMantraRecord extends SvLocation {
  mantra: number;
  body: string;
}

function cleanBody(text: string): string {
  return normalizePara(cleanVedicDumpText(text.replace(/<\/?[a-zA-Z][^>]*>/g, " ").trim()));
}

function parseMantraLines(line: string): Array<{ mantra: number; body: string }> {
  const trimmed = line.trim();
  if (!trimmed.includes("।।")) return [];
  const out: Array<{ mantra: number; body: string }> = [];
  for (const m of trimmed.matchAll(MANTRA_MARKER_FULL)) {
    const body = cleanBody(m[1]!);
    if (!body || isLatinGarbage(body)) continue;
    const mantra = Number(devanagariToArabic(m[2]!));
    if (!Number.isFinite(mantra) || mantra <= 0) continue;
    out.push({ mantra, body });
  }
  if (out.length) return out;

  const tail = MANTRA_MARKER_TAIL.exec(trimmed);
  if (!tail) return out;
  const body = cleanBody(tail[1]!);
  if (!body || isLatinGarbage(body)) return out;
  const mantra = Number(devanagariToArabic(tail[2]!));
  if (!Number.isFinite(mantra) || mantra <= 0) return out;
  out.push({ mantra, body });
  return out;
}

/** Parse Kauthuma accented dump wikitext into mantra records. */
export function parseSamavedaDump(wikitext: string): SvMantraRecord[] {
  const records: SvMantraRecord[] = [];
  let loc: SvLocation | null = null;

  for (const raw of wikitext.split(/\n/)) {
    const line = raw.trim();
    if (!line || SKIP_LINE.test(line)) continue;

    const purva = PURVA_HEADER.exec(line);
    if (purva) {
      loc = {
        arcika: 1,
        prapāṭhaka: Number(purva[3]),
        segment: Number(purva[7]),
        segmentKind: "dasati",
        header: line,
      };
      continue;
    }

    const uttara = UTTARA_RANGE.exec(line);
    if (uttara) {
      loc = {
        arcika: Number(uttara[1]),
        prapāṭhaka: Number(uttara[2]),
        segment: Number(uttara[3]),
        segmentKind: "ardha",
        header: line,
      };
      continue;
    }

    if (line.startsWith("उत्तरार्चिकः/") && loc) {
      loc = { ...loc, header: line };
      continue;
    }

    if (STOBHA.test(line)) continue;

    if (!loc) continue;
    for (const mantra of parseMantraLines(line)) {
      records.push({
        ...loc,
        mantra: mantra.mantra,
        body: mantra.body,
      });
    }
  }

  return records;
}

export function groupSamavedaSegments(
  records: SvMantraRecord[],
  sourceUrl: string,
): ExtractedSegment[] {
  const byKey = new Map<string, ExtractedSegment>();

  for (const rec of records) {
    if (rec.mantra <= 0) continue;
    const key = [rec.arcika, rec.prapāṭhaka, rec.segment].join(":");
    let seg = byKey.get(key);
    if (!seg) {
      seg = {
        source_url: sourceUrl,
        arcika: pad2(rec.arcika),
        prapāṭhaka: pad2(rec.prapāṭhaka),
        segment: pad2(rec.segment),
        segment_kind: rec.segmentKind,
        header: rec.header,
        mantras: [],
      };
      byKey.set(key, seg);
    }
    seg.mantras.push({
      mantra: formatMantraId(rec.mantra),
      samhita_devanagari: rec.body,
    });
  }

  const segments = [...byKey.values()].sort((a, b) => {
    const ak = `${a.arcika}.${a.prapāṭhaka}.${a.segment}`;
    const bk = `${b.arcika}.${b.prapāṭhaka}.${b.segment}`;
    return ak.localeCompare(bk, undefined, { numeric: true });
  });

  return segments.map((s) => ExtractedSegmentSchema.parse(s));
}
