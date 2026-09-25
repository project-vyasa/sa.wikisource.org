import fs from "node:fs/promises";
import path from "node:path";
import { avKandaPages, avSourceUrl } from "../crawl/av";
import { ensureDir } from "../lib/wikimedia";
import {
  parseAtharvavedaKanda,
  readWikitextFromParseJson,
  toExtractedSuktas,
} from "./parse-av";

/**
 * Stage 2: Extract Atharvaveda Śaunaka JSON from cached kāṇḍa wikitext.
 *
 * Usage:
 *   bun run extract:av
 *   bun run src/extract/av.ts 1.1
 */

const RAW_DIR = path.resolve("data/raw/atharvaveda-saunaka");
const EXTRACTED_DIR = path.resolve("data/extracted/atharvaveda-saunaka");
const AUDIT_PATH = path.resolve("data/audit/atharvaveda-saunaka-extract.txt");

function parseTarget(spec: string): { kanda: number; sukta: number } {
  const m = /^(\d{1,2})\.(\d{1,3})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected K.S like 1.1`);
  return { kanda: Number(m[1]), sukta: Number(m[2]) };
}

export async function extractAtharvavedaSaunaka(targets?: string[]) {
  await ensureDir(EXTRACTED_DIR);
  await ensureDir(path.dirname(AUDIT_PATH));

  const wanted = targets?.length
    ? new Set(
        targets.map((t) => {
          const p = parseTarget(t);
          return `${p.kanda}.${p.sukta}`;
        }),
      )
    : null;
  const audit: string[] = [];
  let suktas = 0;
  let riks = 0;

  for (const page of avKandaPages()) {
    const file = path.join(RAW_DIR, "wikitext", page.file);
    const raw = await fs.readFile(file, "utf8");
    const records = parseAtharvavedaKanda(readWikitextFromParseJson(raw), page.kanda);
    const extracted = toExtractedSuktas(records, avSourceUrl(page.kanda), page.file);

    for (const sukta of extracted) {
      const key = `${Number.parseInt(sukta.kanda, 10)}.${Number.parseInt(sukta.sukta, 10)}`;
      if (wanted && !wanted.has(key)) continue;
      const outDir = path.join(EXTRACTED_DIR, sukta.kanda);
      await ensureDir(outDir);
      await fs.writeFile(path.join(outDir, `${sukta.sukta}.json`), JSON.stringify(sukta, null, 2) + "\n", "utf8");
      suktas += 1;
      riks += sukta.riks.length;
      console.log(`[Extract] ${Number(sukta.kanda)}.${Number(sukta.sukta)}: ${sukta.riks.length} ṛk(s)`);
      if (sukta.riks.length === 0) audit.push(`empty_sukta ${sukta.kanda}.${sukta.sukta}`);
    }
  }

  await fs.writeFile(AUDIT_PATH, audit.join("\n") + (audit.length ? "\n" : ""), "utf8");
  console.log(`[Extract] Done. suktas=${suktas} riks=${riks}`);
  console.log(`[Extract] Audit: ${path.relative(process.cwd(), AUDIT_PATH)} (${audit.length} line(s))`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  extractAtharvavedaSaunaka(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
