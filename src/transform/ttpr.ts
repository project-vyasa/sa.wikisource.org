import fs from "node:fs/promises";
import path from "node:path";
import { pad2 } from "../lib/devanagari-numerals";
import { emitBlock } from "../lib/vy-emit";
import { ensureDir } from "../lib/wikimedia";
import {
  ExtractedAdhyayaSchema,
  type ExtractedAdhyaya,
} from "../schema/ttpr";

/**
 * Stage 3: Transform extracted TTPr JSON into data/processed/taittiriya-pratisakhya.
 *
 * Usage:
 *   bun run transform:ttpr
 *   bun run src/transform/ttpr.ts 1
 */

const EXTRACTED_DIR = path.resolve("data/extracted/taittiriya-pratisakhya");
const WORKSPACE_DIR = path.resolve("data/processed/taittiriya-pratisakhya");

function parseTarget(spec: string): number {
  const m = /^(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected adhyāya like 1`);
  return Number(m[1]);
}

function emitContext(adhyaya: ExtractedAdhyaya): string {
  const a = Number.parseInt(adhyaya.adhyaya, 10);
  return (
    "`set context {\n  adhyaya = \"" +
    adhyaya.adhyaya +
    "\",\n  adhyaya.title = \"Adhyāya " +
    String(a) +
    "\"\n}\n"
  );
}

function emitSutraFile(adhyaya: ExtractedAdhyaya): string {
  const parts = [emitContext(adhyaya)];
  for (const sutra of adhyaya.sutras) {
    const n = Number.parseInt(sutra.sutra, 10);
    parts.push(emitBlock("s", n, sutra.mula_devanagari, "TTPr"));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

async function listExtracted(): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const file of entries.sort()) {
    if (file.endsWith(".json")) files.push(path.join(EXTRACTED_DIR, file));
  }
  return files;
}

async function transformOne(filePath: string) {
  const adhyaya = ExtractedAdhyayaSchema.parse(
    JSON.parse(await fs.readFile(filePath, "utf8")),
  );
  const dir = path.join(WORKSPACE_DIR, "content", "sutra");
  await ensureDir(dir);
  await fs.writeFile(
    path.join(dir, `${adhyaya.adhyaya}.vy`),
    emitSutraFile(adhyaya),
    "utf8",
  );
  return { adhyaya: adhyaya.adhyaya, sutras: adhyaya.sutras.length };
}

export async function transformTaittiriyaPratisakhya(targets?: string[]) {
  await ensureDir(path.join(WORKSPACE_DIR, "content"));
  let files: string[];
  if (targets?.length) {
    files = targets.map((spec) => path.join(EXTRACTED_DIR, `${pad2(parseTarget(spec))}.json`));
  } else {
    files = await listExtracted();
    console.log(`[Transform] Found ${files.length} extracted adhyāya JSON file(s).`);
  }

  let ok = 0;
  let failed = 0;
  for (const file of files) {
    try {
      const result = await transformOne(file);
      ok += 1;
      console.log(`[Transform] ${result.adhyaya}: ${result.sutras} sūtra(s)`);
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
  transformTaittiriyaPratisakhya(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
