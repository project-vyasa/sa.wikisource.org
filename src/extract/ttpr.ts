import fs from "node:fs/promises";
import path from "node:path";
import { TTPR_PAGE, ttprSourceUrl } from "../crawl/ttpr";
import { ensureDir } from "../lib/wikimedia";
import { parsePratisakhya } from "./parse-ttpr";
import { readWikitextFromParseJson } from "./parse-tts";

/**
 * Stage 2: Extract Taittirīya-Prātiśākhya JSON from the cached wikitext.
 *
 * Usage:
 *   bun run extract:ttpr
 *   bun run src/extract/ttpr.ts 1
 */

const RAW_DIR = path.resolve("data/raw/taittiriya-pratisakhya");
const EXTRACTED_DIR = path.resolve("data/extracted/taittiriya-pratisakhya");
const AUDIT_PATH = path.resolve("data/audit/taittiriya-pratisakhya-extract.txt");

function parseTarget(spec: string): number {
  const m = /^(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected adhyāya like 1`);
  return Number(m[1]);
}

export async function extractTaittiriyaPratisakhya(targets?: string[]) {
  await ensureDir(EXTRACTED_DIR);
  await ensureDir(path.dirname(AUDIT_PATH));

  const file = path.join(RAW_DIR, TTPR_PAGE.file);
  const raw = await fs.readFile(file, "utf8");
  let adhyayas = parsePratisakhya(readWikitextFromParseJson(raw), ttprSourceUrl());
  if (targets?.length) {
    const wanted = new Set(targets.map(parseTarget));
    adhyayas = adhyayas.filter((a) => wanted.has(Number(a.adhyaya)));
  }

  const audit: string[] = [];
  let ok = 0;
  let sutras = 0;
  for (const adhyaya of adhyayas) {
    const outFile = path.join(EXTRACTED_DIR, `${adhyaya.adhyaya}.json`);
    await fs.writeFile(outFile, JSON.stringify(adhyaya, null, 2) + "\n", "utf8");
    ok += 1;
    sutras += adhyaya.sutras.length;
    console.log(`[Extract] ${Number(adhyaya.adhyaya)}: ${adhyaya.sutras.length} sūtra(s)`);
    if (adhyaya.adhyaya === "00") audit.push("adhyaya_zero");
  }

  await fs.writeFile(AUDIT_PATH, audit.join("\n") + (audit.length ? "\n" : ""), "utf8");
  console.log(`[Extract] Done. adhyayas=${ok} sutras=${sutras}`);
  console.log(`[Extract] Audit: ${path.relative(process.cwd(), AUDIT_PATH)} (${audit.length} line(s))`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  extractTaittiriyaPratisakhya(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
