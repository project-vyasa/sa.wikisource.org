import { primaryChandasFromMeters } from "./vmlt-anukramani";

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

/** Normalize Devanagari digits to ASCII for rik index parsing. */
export function normalizeRikDigits(text: string): string {
  return text.replace(/[०-९]/g, (ch) => String(DEVANAGARI_DIGITS.indexOf(ch)));
}

/** Expand `3`, `3-5`, `1, 2, 4`, or `1, २` tokens into 1-based rik indices. */
export function expandRikRangeTokens(tokens: string): number[] {
  const out: number[] = [];
  const normalized = normalizeRikDigits(tokens);
  for (const part of normalized.split(",")) {
    const token = part.trim();
    if (!token) continue;
    const m = /^(\d+)(?:-(\d+))?$/.exec(token);
    if (!m) continue;
    const start = Number.parseInt(m[1], 10);
    const end = m[2] ? Number.parseInt(m[2], 10) : start;
    for (let i = start; i <= end; i++) out.push(i);
  }
  return out;
}

/**
 * Parse VMLT indexed prose (`1: agni; 3-5: savitṛ`, `1, २: अगस्त्य`) or a scalar (`agni`)
 * into per-rik roman values.
 */
export function parseIndexedProse(
  prose: string | undefined,
  rikCount: number,
): Map<number, string> {
  const result = new Map<number, string>();
  const text = prose?.trim() ?? "";
  if (!text || rikCount <= 0) return result;

  const hasIndexedSegments = /(?:^|;)\s*[\d०-९,\s]+(?:-\d+)?\s*:/.test(text);
  if (!hasIndexedSegments) {
    for (let i = 1; i <= rikCount; i++) result.set(i, text);
    return result;
  }

  for (const segment of text.split(";")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const m = /^([\d०-९,\s]+(?:-\d+)?)\s*:\s*(.+)$/.exec(trimmed);
    if (!m) continue;
    const value = m[2].trim();
    for (const rik of expandRikRangeTokens(m[1])) {
      if (rik >= 1 && rik <= rikCount) result.set(rik, value);
    }
  }
  return result;
}

/** IAST letters in VMLT meter names (ṅ is required for paṅkti / prastārapaṅkti, etc.). */
const IAST_METER_CHARS = "a-zāīūṛṝḷḹēōṃḥśṣṭḍṇṅñ";

const METER_CHUNK_RE = new RegExp(
  `([${IAST_METER_CHARS}]+(?:\\s+[${IAST_METER_CHARS}]+)*)\\s*\\(([^)]+)\\)`,
  "gi",
);

function meterSection(meters: string): string {
  const second = /2nd set of styles:\s*(.+)$/i.exec(meters);
  return (second?.[1] ?? meters).trim();
}

/** Map 1-based rik index → IAST meter substring from VMLT `info.meters`. */
export function parseMeterRanges(
  meters: string | undefined,
  rikCount: number,
): Map<number, string> {
  const result = new Map<number, string>();
  const text = meters?.trim() ?? "";
  if (!text || rikCount <= 0) return result;

  const section = meterSection(text);
  let matched = false;

  for (const match of section.matchAll(METER_CHUNK_RE)) {
    matched = true;
    const meterName = match[1].trim();
    const riks = expandRikRangeTokens(match[2]);
    for (const rik of riks) {
      if (rik >= 1 && rik <= rikCount) result.set(rik, meterName);
    }
  }

  if (!matched) {
    const scalar = section.replace(/^\d+(?:st|nd|rd|th) set of styles:\s*/i, "").trim();
    if (scalar) {
      for (let i = 1; i <= rikCount; i++) result.set(i, scalar);
    }
  }

  return result;
}

export interface RikAnukramaniRoman {
  rishi?: string;
  devata?: string;
  chandas?: string;
}

/** Merge VMLT `info` fields into per-rik roman tuples (1-based keys). */
export function buildPerRikRoman(
  info: { from?: string; to?: string; meters?: string },
  rikCount: number,
): Map<number, RikAnukramaniRoman> {
  const rishiByRik = parseIndexedProse(info.from, rikCount);
  const devataByRik = parseIndexedProse(info.to, rikCount);
  const meterByRik = parseMeterRanges(info.meters, rikCount);

  const fallbackChandas = primaryChandasFromMeters(info.meters ?? "");

  const out = new Map<number, RikAnukramaniRoman>();
  for (let rik = 1; rik <= rikCount; rik++) {
    const entry: RikAnukramaniRoman = {};
    const rishi = rishiByRik.get(rik);
    const devata = devataByRik.get(rik);
    const meter = meterByRik.get(rik);
    if (rishi) entry.rishi = rishi;
    if (devata) entry.devata = devata;
    if (meter) entry.chandas = meter;
    else if (fallbackChandas) entry.chandas = fallbackChandas;
    out.set(rik, entry);
  }
  return out;
}

export interface CoalescedSpan<T> {
  start: number;
  end: number;
  value: T;
}

export function coalesceEqualRuns<T>(
  rikCount: number,
  valueAt: (rik: number) => T | undefined,
  equals: (a: T, b: T) => boolean,
): CoalescedSpan<T>[] {
  const spans: CoalescedSpan<T>[] = [];
  let rik = 1;
  while (rik <= rikCount) {
    const current = valueAt(rik);
    if (current === undefined) {
      rik += 1;
      continue;
    }
    let end = rik;
    while (end < rikCount) {
      const next = valueAt(end + 1);
      if (next === undefined || !equals(current, next)) break;
      end += 1;
    }
    spans.push({ start: rik, end, value: current });
    rik = end + 1;
  }
  return spans;
}

export function triplesEqual(
  a: { rishi: string; devata: string; chandas: string },
  b: { rishi: string; devata: string; chandas: string },
): boolean {
  return a.rishi === b.rishi && a.devata === b.devata && a.chandas === b.chandas;
}

export function isUniformTriple(
  perRik: Map<number, { rishi: string; devata: string; chandas: string }>,
  rikCount: number,
): boolean {
  if (rikCount <= 0) return false;
  const first = perRik.get(1);
  if (!first?.rishi || !first.devata || !first.chandas) return false;
  for (let rik = 2; rik <= rikCount; rik++) {
    const entry = perRik.get(rik);
    if (!entry || !triplesEqual(first, entry)) return false;
  }
  return true;
}
