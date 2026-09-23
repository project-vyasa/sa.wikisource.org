import { normalizePara } from "../lib/html-text";
import { pad2 } from "../lib/devanagari-numerals";
import type { DumpRecord } from "./parse-tts";
import {
  ExtractedPrasnaSchema,
  type ExtractedAnuvaka,
  type ExtractedPrasna,
} from "../schema/tta";

export function groupTtaPrasnas(
  records: DumpRecord[],
  sourceUrl: string,
): ExtractedPrasna[] {
  const byPrasna = new Map<
    number,
    {
      prasna: number;
      headers: string[];
      anuvakas: Map<
        number,
        { headers: string[]; mantras: Array<{ n: number; text: string }> }
      >;
    }
  >();

  for (const rec of records) {
    if (!rec.prasna) continue;
    let bucket = byPrasna.get(rec.prasna);
    if (!bucket) {
      bucket = { prasna: rec.prasna, headers: [], anuvakas: new Map() };
      byPrasna.set(rec.prasna, bucket);
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
  for (const prasna of [...byPrasna.keys()].sort((a, b) => a - b)) {
    const bucket = byPrasna.get(prasna)!;
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
        source_url: sourceUrl,
        prasna: pad2(bucket.prasna),
        header: bucket.headers.join(" ").trim() || null,
        anuvakas,
      }),
    );
  }
  return out;
}
