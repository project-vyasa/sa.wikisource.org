import fs from "node:fs/promises";
import path from "node:path";
import { pad2 } from "../lib/devanagari-numerals";
import { emitBlock } from "../lib/vy-emit";
import { ensureDir } from "../lib/wikimedia";
import { ExtractedUnitSchema, type ExtractedUnit } from "../schema/gp";

/**
 * Stage 3: Transform extracted Gopatha JSON into data/processed/gopatha-brahmana.
 *
 * Usage:
 *   bun run transform:gp
 *   bun run src/transform/gp.ts 1.1.1
 */

const EXTRACTED_DIR = path.resolve("data/extracted/gopatha-brahmana");
const WORKSPACE_DIR = path.resolve("data/processed/gopatha-brahmana");

function parseTarget(spec: string): { kanda: number; prapathaka: number; kandika: number } {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected K.P.K like 1.1.1`);
  return { kanda: Number(m[1]), prapathaka: Number(m[2]), kandika: Number(m[3]) };
}

function emitContext(unit: ExtractedUnit): string {
  const k = Number.parseInt(unit.kanda, 10);
  const p = Number.parseInt(unit.prapathaka, 10);
  const kd = Number.parseInt(unit.kandika, 10);
  return (
    "`set context {\n" +
    `  kanda = "${unit.kanda}",\n` +
    `  prapathaka = "${unit.prapathaka}",\n` +
    `  kandika = "${unit.kandika}",\n` +
    `  kanda.title = "Kāṇḍa ${k}",\n` +
    `  unit.title = "${k}.${p}.${kd}"\n` +
    "}\n"
  );
}

function emitUnitFile(unit: ExtractedUnit): string {
  const parts = [emitContext(unit)];
  for (let i = 0; i < unit.padas.length; i++) {
    parts.push(emitBlock("p", i + 1, unit.padas[i]!.body, "GP"));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

async function listExtracted(): Promise<string[]> {
  const files: string[] = [];
  for (const kanda of (await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[])).sort()) {
    if (!/^\d{2}$/.test(kanda)) continue;
    for (const file of (await fs.readdir(path.join(EXTRACTED_DIR, kanda))).sort()) {
      if (file.endsWith(".json")) files.push(path.join(EXTRACTED_DIR, kanda, file));
    }
  }
  return files;
}

function matchesTarget(filePath: string, targets: Set<string>): boolean {
  const parts = filePath.split(path.sep);
  const file = parts.at(-1)?.replace(/\.json$/, "");
  const kanda = parts.at(-2);
  if (!kanda || !file) return false;
  const [p, kd] = file.split("-");
  return targets.has(`${kanda}-${p}-${kd}`);
}

async function transformOne(filePath: string) {
  const unit = ExtractedUnitSchema.parse(JSON.parse(await fs.readFile(filePath, "utf8")));
  const dir = path.join(WORKSPACE_DIR, "content", "samhita", unit.kanda);
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, `${unit.prapathaka}-${unit.kandika}.vy`), emitUnitFile(unit), "utf8");
  return { padas: unit.padas.length };
}

export async function transformGopathaBrahmana(targets?: string[]) {
  const files = await listExtracted();
  const wanted = targets?.length
    ? new Set(
        targets.map((t) => {
          const p = parseTarget(t);
          return `${pad2(p.kanda)}-${pad2(p.prapathaka)}-${pad2(p.kandika)}`;
        }),
      )
    : null;

  let units = 0;
  let padas = 0;
  for (const file of files) {
    if (wanted && !matchesTarget(file, wanted)) continue;
    const result = await transformOne(file);
    units += 1;
    padas += result.padas;
  }
  console.log(`[Transform] units=${units} padas=${padas} → ${WORKSPACE_DIR}`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  transformGopathaBrahmana(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
