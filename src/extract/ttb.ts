import fs from "node:fs/promises";
import path from "node:path";
import { TTB_ACCENTED_PAGE, ttbSourceUrlForKanda } from "../crawl/ttb";
import { ensureDir } from "../lib/wikimedia";
import { groupPrasnas, parseDumpRecords, readWikitextFromParseJson } from "./parse-tts";

/**
 * Stage 2: Extract Taittirīya Brāhmaṇa JSON from the cached accented dump.
 *
 * Usage:
 *   bun run extract:ttb
 *   bun run src/extract/ttb.ts 1.1
 */

const RAW_DIR = path.resolve("data/raw/taittiriya-brahmana");
const EXTRACTED_DIR = path.resolve("data/extracted/taittiriya-brahmana");
const AUDIT_PATH = path.resolve("data/audit/taittiriya-brahmana-extract.txt");

function parseTarget(spec: string): { kanda: number; prasna?: number } {
  const m = /^(\d{1,2})(?:\.(\d{1,2}))?$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected K or K.P like 1 or 1.1`);
  return { kanda: Number(m[1]), prasna: m[2] ? Number(m[2]) : undefined };
}

export async function extractTaittiriyaBrahmana(targets?: string[]) {
  await ensureDir(EXTRACTED_DIR);
  await ensureDir(path.dirname(AUDIT_PATH));

  const file = path.join(RAW_DIR, "accented", TTB_ACCENTED_PAGE.file);
  const raw = await fs.readFile(file, "utf8");
  const records = parseDumpRecords(readWikitextFromParseJson(raw));

  let prasnas = groupPrasnas(records, ttbSourceUrlForKanda);
  if (targets?.length) {
    const wanted = targets.map(parseTarget);
    prasnas = prasnas.filter((p) =>
      wanted.some((t) => {
        if (t.kanda !== Number(p.kanda)) return false;
        if (t.prasna == null) return true;
        return t.prasna === Number(p.prasna);
      }),
    );
  }

  const audit: string[] = [];
  let ok = 0;
  let mantras = 0;
  for (const prasna of prasnas) {
    const outDir = path.join(EXTRACTED_DIR, prasna.kanda);
    await ensureDir(outDir);
    const outFile = path.join(outDir, `${prasna.kanda}-${prasna.prasna}.json`);
    await fs.writeFile(outFile, JSON.stringify(prasna, null, 2) + "\n", "utf8");
    ok += 1;
    const n = prasna.anuvakas.reduce((s, a) => s + a.mantras.length, 0);
    mantras += n;
    console.log(
      `[Extract] ${Number(prasna.kanda)}.${Number(prasna.prasna)}: ${prasna.anuvakas.length} anuvāka(s), ${n} mantra(s)`,
    );
    for (const anu of prasna.anuvakas) {
      if (anu.anuvaka === "00") audit.push(`anuvaka_zero ${prasna.kanda}.${prasna.prasna}`);
    }
  }

  await fs.writeFile(AUDIT_PATH, audit.join("\n") + (audit.length ? "\n" : ""), "utf8");
  console.log(`[Extract] Done. prasnas=${ok} mantras=${mantras}`);
  console.log(`[Extract] Audit: ${path.relative(process.cwd(), AUDIT_PATH)} (${audit.length} line(s))`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  extractTaittiriyaBrahmana(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
