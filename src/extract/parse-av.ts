import { devanagariToArabic, pad2, pad3 } from "../lib/devanagari-numerals";
import { normalizePara } from "../lib/html-text";
import { cleanVedicDumpText, isLatinGarbage } from "../lib/vedic-pua";
import { ExtractedSuktaSchema, type ExtractedSukta } from "../schema/av";
import { readWikitextFromParseJson } from "./parse-tts";

export { readWikitextFromParseJson };

const SUKTA_HEADER = /^(\d+)[,.](\d+)\s*$/;
const SKIP_LINE = /^\[\[|^\*?\[\[|drive\.google|^\*http|^<poem>|^<\/poem>|^<span/i;
const RIK_END = /॥\s*([०-९0-9]+)\s*॥/;

function stripMarkup(line: string): string {
  return line.replace(/<[^>]*>/g, "").trim();
}

function cleanBody(text: string): string {
  return normalizePara(cleanVedicDumpText(text.replace(/<\/?[a-zA-Z][^>]*>/g, " ").trim()));
}

interface SuktaDraft {
  kanda: number;
  sukta: number;
  riks: Array<{ rik: number; body: string }>;
}

/** Parse one consolidated Atharvaveda kāṇḍa page wikitext into sūkta records. */
export function parseAtharvavedaKanda(
  wikitext: string,
  kanda: number,
): SuktaDraft[] {
  const bySukta = new Map<number, SuktaDraft>();
  let currentSukta: number | null = null;
  let pending: string[] = [];

  function flushRik(line: string) {
    if (currentSukta == null) return;
    const end = RIK_END.exec(line);
    if (!end) return;
    const tail = line.replace(/॥\s*[०-९0-9]+\s*॥.*$/, "").trim();
    if (tail) pending.push(tail);
    const body = cleanBody(pending.join(" "));
    pending = [];
    if (!body || isLatinGarbage(body)) return;
    const rik = Number(devanagariToArabic(end[1]!));
    if (!Number.isFinite(rik) || rik <= 0) return;
    let sukta = bySukta.get(currentSukta);
    if (!sukta) {
      sukta = { kanda, sukta: currentSukta, riks: [] };
      bySukta.set(currentSukta, sukta);
    }
    sukta.riks.push({ rik, body });
  }

  for (const raw of wikitext.split(/\n/)) {
    const stripped = stripMarkup(raw);
    if (!stripped || SKIP_LINE.test(stripped)) continue;

    const header = SUKTA_HEADER.exec(stripped);
    if (header) {
      const k = Number(header[1]!);
      const s = Number(header[2]!);
      if (k !== kanda) continue;
      currentSukta = s;
      pending = [];
      if (!bySukta.has(s)) bySukta.set(s, { kanda, sukta: s, riks: [] });
      continue;
    }

    if (currentSukta == null) continue;

    if (RIK_END.test(stripped)) {
      flushRik(stripped);
      continue;
    }

    pending.push(stripped);
  }

  return [...bySukta.values()]
    .filter((s) => s.riks.length > 0)
    .sort((a, b) => a.sukta - b.sukta);
}

export function toExtractedSuktas(
  records: SuktaDraft[],
  sourceUrl: string,
  sourceFile: string,
): ExtractedSukta[] {
  return records.map((rec) =>
    ExtractedSuktaSchema.parse({
      source_url: sourceUrl,
      source_file: sourceFile,
      kanda: pad2(rec.kanda),
      sukta: pad3(rec.sukta),
      riks: rec.riks.map((r) => ({
        rik: pad2(r.rik),
        samhita_devanagari: r.body,
      })),
    }),
  );
}
