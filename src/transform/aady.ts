import fs from "node:fs/promises";
import path from "node:path";
import { pad2 } from "../lib/devanagari-numerals";
import { emitBlock } from "../lib/vy-emit";
import { ensureDir } from "../lib/wikimedia";
import {
  ExtractedPadaSchema,
  type ExtractedPada,
} from "../schema/aady";

/**
 * Stage 3: Transform extracted Aṣṭādhyāyī JSON into data/processed/ashtadhyayi.
 *
 * Usage:
 *   bun run transform:aady
 *   bun run src/transform/aady.ts 1.1
 */

const EXTRACTED_DIR = path.resolve("data/extracted/ashtadhyayi");
const WORKSPACE_DIR = path.resolve("data/processed/ashtadhyayi");
const MISSING = "— [not present in Wikisource source] —";

function parseTarget(spec: string): { adhyaya: number; pada: number } {
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected A.P like 1.1`);
  return { adhyaya: Number(m[1]), pada: Number(m[2]) };
}

function emitContext(pada: ExtractedPada): string {
  const a = Number.parseInt(pada.adhyaya, 10);
  const p = Number.parseInt(pada.pada, 10);
  const adhyayaTitle = a === 9 ? "Maheśvara sūtras" : "Adhyāya " + String(a);
  const padaTitle = a === 9 ? "Pratyāhāra" : "Pāda " + String(a) + "." + String(p);
  return (
    "`set context {\n  adhyaya = \"" +
    pada.adhyaya +
    "\",\n  pada = \"" +
    pada.pada +
    "\",\n  adhyaya.title = \"" +
    adhyayaTitle +
    "\",\n  pada.title = \"" +
    padaTitle +
    "\"\n}\n"
  );
}

function emitStream(
  pada: ExtractedPada,
  pick: (s: ExtractedPada["sutras"][number]) => string,
): string {
  const parts = [emitContext(pada)];
  for (const sutra of pada.sutras) {
    const n = Number.parseInt(sutra.sutra, 10);
    parts.push(emitBlock("s", n, pick(sutra), "A"));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

async function listExtracted(): Promise<string[]> {
  const files: string[] = [];
  const dirs = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const dir of dirs.sort()) {
    if (!/^\d{2}$/.test(dir)) continue;
    for (const file of (await fs.readdir(path.join(EXTRACTED_DIR, dir))).sort()) {
      if (file.endsWith(".json")) files.push(path.join(EXTRACTED_DIR, dir, file));
    }
  }
  return files;
}

async function transformOne(filePath: string) {
  const pada = ExtractedPadaSchema.parse(JSON.parse(await fs.readFile(filePath, "utf8")));
  for (const stream of ["sutra", "vyakhya", "udaharana"] as const) {
    await ensureDir(path.join(WORKSPACE_DIR, "content", stream, pada.adhyaya));
  }
  const base = `${pada.pada}.vy`;
  const writes: Array<[string, string]> = [
    [
      path.join(WORKSPACE_DIR, "content", "sutra", pada.adhyaya, base),
      emitStream(pada, (s) => s.mula_devanagari),
    ],
    [
      path.join(WORKSPACE_DIR, "content", "vyakhya", pada.adhyaya, base),
      emitStream(pada, (s) => s.vyakhya_hindi?.trim() || MISSING),
    ],
    [
      path.join(WORKSPACE_DIR, "content", "udaharana", pada.adhyaya, base),
      emitStream(pada, (s) => s.udaharana?.trim() || MISSING),
    ],
  ];
  for (const [out, body] of writes) await fs.writeFile(out, body, "utf8");
  return { adhyaya: pada.adhyaya, pada: pada.pada, sutras: pada.sutras.length };
}

export async function transformAshtadhyayi(targets?: string[]) {
  await ensureDir(path.join(WORKSPACE_DIR, "content"));
  let files: string[];
  if (targets?.length) {
    files = targets.map((spec) => {
      const { adhyaya, pada } = parseTarget(spec);
      return path.join(EXTRACTED_DIR, pad2(adhyaya), `${pad2(adhyaya)}-${pad2(pada)}.json`);
    });
  } else {
    files = await listExtracted();
    console.log(`[Transform] Found ${files.length} extracted pāda JSON file(s).`);
  }

  let ok = 0;
  let failed = 0;
  for (const file of files) {
    try {
      const result = await transformOne(file);
      ok += 1;
      console.log(
        `[Transform] ${result.adhyaya}.${result.pada}: ${result.sutras} sūtra(s)`,
      );
    } catch (err) {
      failed += 1;
      console.error(
        `[Transform] FAILED ${path.relative(process.cwd(), file)}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(`[Transform] Done. ok=${ok} failed=${failed}`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  transformAshtadhyayi(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
