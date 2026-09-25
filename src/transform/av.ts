import fs from "node:fs/promises";
import path from "node:path";
import { emitBlock } from "../lib/vy-emit";
import { ensureDir } from "../lib/wikimedia";
import { ExtractedSuktaSchema, suktaTitle, type ExtractedSukta } from "../schema/av";

/**
 * Stage 3: Transform extracted AV JSON into data/processed/atharvaveda-saunaka.
 *
 * Usage:
 *   bun run transform:av
 *   bun run src/transform/av.ts 1.1
 */

const EXTRACTED_DIR = path.resolve("data/extracted/atharvaveda-saunaka");
const WORKSPACE_DIR = path.resolve("data/processed/atharvaveda-saunaka");

function parseTarget(spec: string): { kanda: number; sukta: number } {
  const m = /^(\d{1,2})\.(\d{1,3})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected K.S like 1.1`);
  return { kanda: Number(m[1]), sukta: Number(m[2]) };
}

function emitContext(sukta: ExtractedSukta): string {
  const title = suktaTitle(sukta.kanda, sukta.sukta);
  return (
    "`set context {\n" +
    `  kanda = "${sukta.kanda}",\n` +
    `  sukta = "${sukta.sukta}",\n` +
    `  kanda.title = "Kāṇḍa ${Number.parseInt(sukta.kanda, 10)}",\n` +
    `  sukta.title = "${title}"\n` +
    "}\n"
  );
}

function emitSuktaFile(sukta: ExtractedSukta): string {
  const parts = [emitContext(sukta)];
  for (const rik of sukta.riks) {
    const n = Number.parseInt(rik.rik, 10);
    parts.push(emitBlock("v", n, rik.samhita_devanagari));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

async function listExtracted(): Promise<string[]> {
  const files: string[] = [];
  const kandas = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const kanda of kandas.sort()) {
    if (!/^\d{2}$/.test(kanda)) continue;
    for (const file of (await fs.readdir(path.join(EXTRACTED_DIR, kanda))).sort()) {
      if (file.endsWith(".json")) files.push(path.join(EXTRACTED_DIR, kanda, file));
    }
  }
  return files;
}

function matchesTarget(filePath: string, targets: Set<string>): boolean {
  const parts = filePath.split(path.sep);
  const sukta = parts.at(-1)?.replace(/\.json$/, "");
  const kanda = parts.at(-2);
  if (!kanda || !sukta) return false;
  return targets.has(`${Number.parseInt(kanda, 10)}.${Number.parseInt(sukta, 10)}`);
}

async function transformOne(filePath: string) {
  const sukta = ExtractedSuktaSchema.parse(JSON.parse(await fs.readFile(filePath, "utf8")));
  const dir = path.join(WORKSPACE_DIR, "content", "samhita", sukta.kanda);
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, `${sukta.sukta}.vy`), emitSuktaFile(sukta), "utf8");
  return { riks: sukta.riks.length };
}

export async function transformAtharvavedaSaunaka(targets?: string[]) {
  const files = await listExtracted();
  const wanted = targets?.length ? new Set(targets.map((t) => t.trim())) : null;

  let suktas = 0;
  let riks = 0;
  for (const file of files) {
    if (wanted && !matchesTarget(file, wanted)) continue;
    const result = await transformOne(file);
    suktas += 1;
    riks += result.riks;
  }
  console.log(`[Transform] suktas=${suktas} riks=${riks} → ${WORKSPACE_DIR}`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  transformAtharvavedaSaunaka(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
