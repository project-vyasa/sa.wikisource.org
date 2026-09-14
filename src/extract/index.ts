import fs from "node:fs/promises";
import path from "node:path";
import { arabicToDevanagari, pad2, pad3 } from "../lib/devanagari-numerals";
import { parseSuktaHtml } from "./parse-sukta";

/**
 * Stage 2: Extract structured Rig Veda JSON from cached Wikisource HTML.
 *
 * Usage:
 *   bun run extract:rv              # all cached suktas
 *   bun run src/extract/index.ts 1.1 1.185
 */

const RAW_DIR = path.resolve("data/raw/rigveda");
const EXTRACTED_DIR = path.resolve("data/extracted/rigveda");
const BASE_DOMAIN = "https://sa.wikisource.org";

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

function parseTarget(spec: string): { mandala: number; sukta: number } {
  const m = /^(\d{1,2})\.(\d{1,3})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid sukta spec "${spec}"; expected M.S like 1.1 or 1.185`);
  return { mandala: Number(m[1]), sukta: Number(m[2]) };
}

function suktaSourceUrl(mandala: number, sukta: number): string {
  const title = `ऋग्वेदः_सूक्तं_${arabicToDevanagari(String(mandala))}.${arabicToDevanagari(String(sukta))}`;
  return `${BASE_DOMAIN}/wiki/${encodeURIComponent(title)}`;
}

async function listCachedSuktas(): Promise<Array<{ mandala: number; sukta: number; file: string }>> {
  const out: Array<{ mandala: number; sukta: number; file: string }> = [];
  const mandalas = await fs.readdir(RAW_DIR);
  for (const mandalaDir of mandalas.sort()) {
    if (!/^\d{2}$/.test(mandalaDir)) continue;
    const dir = path.join(RAW_DIR, mandalaDir);
    const files = await fs.readdir(dir);
    for (const file of files.sort()) {
      const m = /^(\d{2})-(\d{3})\.html$/.exec(file);
      if (!m) continue;
      out.push({
        mandala: Number(m[1]),
        sukta: Number(m[2]),
        file: path.join(dir, file),
      });
    }
  }
  return out;
}

async function extractOne(mandala: number, sukta: number, filePath?: string) {
  const mm = pad2(mandala);
  const sss = pad3(sukta);
  const resolved =
    filePath ?? path.join(RAW_DIR, mm, `${mm}-${sss}.html`);

  const html = await fs.readFile(resolved, "utf8");
  const parsed = parseSuktaHtml({
    html,
    sourceFile: path.relative(process.cwd(), resolved),
    sourceUrl: suktaSourceUrl(mandala, sukta),
    mandala,
    sukta,
  });

  const outDir = path.join(EXTRACTED_DIR, mm);
  await ensureDir(outDir);
  const outFile = path.join(outDir, `${mm}-${sss}.json`);
  await fs.writeFile(outFile, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  return { outFile, rikCount: parsed.riks.length, rishi: parsed.anukramani.rishi };
}

export async function extractRigVeda(targets?: string[]) {
  await ensureDir(EXTRACTED_DIR);
  console.log(`[Extract] Writing JSON under ${EXTRACTED_DIR}`);

  let jobs: Array<{ mandala: number; sukta: number; file?: string }>;
  if (targets && targets.length > 0) {
    jobs = targets.map(parseTarget);
  } else {
    const cached = await listCachedSuktas();
    jobs = cached.map((c) => ({ mandala: c.mandala, sukta: c.sukta, file: c.file }));
    console.log(`[Extract] Found ${jobs.length} cached sukta HTML file(s).`);
  }

  let ok = 0;
  let failed = 0;
  for (const job of jobs) {
    const label = `${job.mandala}.${job.sukta}`;
    try {
      const result = await extractOne(job.mandala, job.sukta, job.file);
      ok += 1;
      console.log(
        `[Extract] ${label}: ${result.rikCount} rik(s)` +
          (result.rishi ? `, rishi=${result.rishi}` : "") +
          ` → ${path.relative(process.cwd(), result.outFile)}`,
      );
    } catch (err) {
      failed += 1;
      console.error(`[Extract] FAILED ${label}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[Extract] Done. ok=${ok} failed=${failed}`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  extractRigVeda(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
