import { decodeEntities, normalizePara } from "../lib/html-text";
import { pad2 } from "../lib/devanagari-numerals";
import { cleanVedicDumpText, isLatinGarbage } from "../lib/vedic-pua";
import {
  ExtractedPrasnaSchema,
  type ExtractedAnuvaka,
  type ExtractedPrasna,
} from "../schema/tts";

const ID_LINE_4 = /^(\d{1,2})\.(\d{1,2})\.(\d{1,2})\.(\d{1,2})[०-९]*\s*$/;
const ID_LINE_3 = /^(\d{1,2})\.(\d{1,2})\.(\d{1,2})[०-९]*\s*$/;
const ID_LINE_2 = /^(\d{1,2})\.(\d{1,2})[०-९]*\s*$/;

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

function unwrapPre(wikitext: string): string {
  return wikitext
    .replace(/^\s*<pre>\s*/i, "")
    .replace(/\s*<\/pre>\s*$/i, "");
}

function cleanBody(text: string): string {
  let body = text.replace(/<\/?[a-zA-Z][^>]*>/g, " ").trim();
  if (body.startsWith("<") && body.endsWith(">")) {
    body = body.slice(1, -1).trim();
  }
  return normalizePara(cleanVedicDumpText(body));
}

export interface DumpRecord {
  kanda: number;
  prasna: number;
  anuvaka: number;
  mantra: number;
  body: string;
}

export interface ParseDumpOpts {
  /** TTS / TTB dumps are 4-part `K.P.A.M`. TTA is 3-part `P.A.M`. */
  parts?: 3 | 4;
  /**
   * TTA praśna 3 is dumped as 2-part `A.M` between 2.19 and 4.0.0.
   * Those ids are promoted to this praśna (default 3).
   */
  twoPartPrasna?: number;
}

/** Split accented dump wikitext on line ids. */
export function parseDumpRecords(
  wikitext: string,
  opts: ParseDumpOpts = {},
): DumpRecord[] {
  const parts = opts.parts ?? 4;
  const twoPartPrasna = opts.twoPartPrasna ?? 3;
  const text = unwrapPre(wikitext);
  const lines = text.split(/\n/);
  const records: DumpRecord[] = [];
  let current: DumpRecord | null = null;
  const chunks: string[] = [];

  const flush = () => {
    if (!current) return;
    const body = cleanBody(chunks.join("\n"));
    chunks.length = 0;
    if (body && !isLatinGarbage(body)) records.push({ ...current, body });
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (parts === 4) {
      const m = ID_LINE_4.exec(trimmed);
      if (m) {
        flush();
        current = {
          kanda: Number(m[1]),
          prasna: Number(m[2]),
          anuvaka: Number(m[3]),
          mantra: Number(m[4]),
          body: "",
        };
        continue;
      }
    } else {
      const m3 = ID_LINE_3.exec(trimmed);
      if (m3) {
        flush();
        current = {
          kanda: 0,
          prasna: Number(m3[1]),
          anuvaka: Number(m3[2]),
          mantra: Number(m3[3]),
          body: "",
        };
        continue;
      }
      const m2 = ID_LINE_2.exec(trimmed);
      if (m2) {
        flush();
        current = {
          kanda: 0,
          prasna: twoPartPrasna,
          anuvaka: Number(m2[1]),
          mantra: Number(m2[2]),
          body: "",
        };
        continue;
      }
    }
    if (current) chunks.push(line);
  }
  flush();
  return records;
}

export function groupPrasnas(
  records: DumpRecord[],
  sourceUrlFor: (kanda: number) => string,
): ExtractedPrasna[] {
  const byPrasna = new Map<
    string,
    {
      kanda: number;
      prasna: number;
      headers: string[];
      anuvakas: Map<
        number,
        { headers: string[]; mantras: Array<{ n: number; text: string }> }
      >;
    }
  >();

  const prasnaKey = (k: number, p: number) => `${pad2(k)}.${pad2(p)}`;

  for (const rec of records) {
    if (!rec.kanda || !rec.prasna) continue;
    const key = prasnaKey(rec.kanda, rec.prasna);
    let bucket = byPrasna.get(key);
    if (!bucket) {
      bucket = {
        kanda: rec.kanda,
        prasna: rec.prasna,
        headers: [],
        anuvakas: new Map(),
      };
      byPrasna.set(key, bucket);
    }

    if (rec.anuvaka === 0 && rec.mantra === 0) {
      bucket.headers.push(rec.body);
      continue;
    }

    if (rec.anuvaka === 0) continue;

    let anu = bucket.anuvakas.get(rec.anuvaka);
    if (!anu) {
      anu = { headers: [], mantras: [] };
      bucket.anuvakas.set(rec.anuvaka, anu);
    }

    if (rec.mantra === 0) {
      anu.headers.push(rec.body);
      continue;
    }

    const existing = anu.mantras.find((m) => m.n === rec.mantra);
    if (existing) existing.text = normalizePara(`${existing.text} ${rec.body}`);
    else anu.mantras.push({ n: rec.mantra, text: rec.body });
  }

  const out: ExtractedPrasna[] = [];
  const keys = [...byPrasna.keys()].sort();
  for (const key of keys) {
    const bucket = byPrasna.get(key)!;
    const anuvakas: ExtractedAnuvaka[] = [...bucket.anuvakas.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([n, anu]) => ({
        anuvaka: pad2(n),
        header: anu.headers.join(" ").trim() || null,
        mantras: anu.mantras
          .sort((a, b) => a.n - b.n)
          .map((m) => ({
            mantra: pad2(m.n),
            samhita_devanagari: m.text,
          })),
      }))
      .filter((a) => a.mantras.length > 0);

    if (!anuvakas.length) continue;

    out.push(
      ExtractedPrasnaSchema.parse({
        source_url: sourceUrlFor(bucket.kanda),
        kanda: pad2(bucket.kanda),
        prasna: pad2(bucket.prasna),
        header: bucket.headers.join(" ").trim() || null,
        anuvakas,
      }),
    );
  }
  return out;
}
