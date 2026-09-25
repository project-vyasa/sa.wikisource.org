import fs from "node:fs/promises";
import path from "node:path";
import { emitBlock } from "../lib/vy-emit";
import { ensureDir } from "../lib/wikimedia";
import {
  ExtractedSegmentSchema,
  segmentTitle,
  type ExtractedSegment,
} from "../schema/sv";

/**
 * Stage 3: Transform extracted Kauthuma SV JSON into data/processed/kauthuma-samhita.
 *
 * Usage:
 *   bun run transform:sv
 *   bun run src/transform/sv.ts 01.01.01
 */

const EXTRACTED_DIR = path.resolve("data/extracted/kauthuma-samhita");
const WORKSPACE_DIR = path.resolve("data/processed/kauthuma-samhita");

function parseTarget(spec: string): { arcika: number; prapāṭhaka: number; segment: number } {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{1,2})$/.exec(spec.trim());
  if (!m) {
    throw new Error(`Invalid spec "${spec}"; expected arcika.prapāṭhaka.segment like 01.01.01`);
  }
  return { arcika: Number(m[1]), prapāṭhaka: Number(m[2]), segment: Number(m[3]) };
}

function emitContext(seg: ExtractedSegment): string {
  const title = segmentTitle(seg.arcika, seg.prapāṭhaka, seg.segment, seg.segment_kind);
  return (
    "`set context {\n" +
    `  arcika = "${seg.arcika}",\n` +
    `  prapāṭhaka = "${seg.prapāṭhaka}",\n` +
    `  segment = "${seg.segment}",\n` +
    `  segment.kind = "${seg.segment_kind}",\n` +
    `  segment.title = "${title}"\n` +
    "}\n"
  );
}

function emitSegmentFile(seg: ExtractedSegment): string {
  const parts = [emitContext(seg)];
  for (const mantra of seg.mantras) {
    const n = Number.parseInt(mantra.mantra, 10);
    parts.push(emitBlock("mantra", n, mantra.samhita_devanagari, "SV"));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

async function listExtracted(): Promise<string[]> {
  const files: string[] = [];
  const arcikas = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const arcika of arcikas.sort()) {
    if (!/^\d{2}$/.test(arcika)) continue;
    for (const prap of (await fs.readdir(path.join(EXTRACTED_DIR, arcika))).sort()) {
      if (!/^\d{2}$/.test(prap)) continue;
      for (const file of (await fs.readdir(path.join(EXTRACTED_DIR, arcika, prap))).sort()) {
        if (file.endsWith(".json")) files.push(path.join(EXTRACTED_DIR, arcika, prap, file));
      }
    }
  }
  return files;
}

function matchesTarget(filePath: string, targets: Set<string>): boolean {
  const parts = filePath.split(path.sep);
  const segment = parts.at(-1)?.replace(/\.json$/, "");
  const prap = parts.at(-2);
  const arcika = parts.at(-3);
  if (!arcika || !prap || !segment) return false;
  return targets.has(`${arcika}.${prap}.${segment}`);
}

async function transformOne(filePath: string) {
  const seg = ExtractedSegmentSchema.parse(JSON.parse(await fs.readFile(filePath, "utf8")));
  const dir = path.join(WORKSPACE_DIR, "content", "samhita", seg.arcika, seg.prapāṭhaka);
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, `${seg.segment}.vy`), emitSegmentFile(seg), "utf8");
  return { mantras: seg.mantras.length };
}

export async function transformKauthumaSamhita(targets?: string[]) {
  const files = await listExtracted();
  const wanted = targets?.length
    ? new Set(
        targets.map((t) => {
          const p = parseTarget(t);
          return [
            String(p.arcika).padStart(2, "0"),
            String(p.prapāṭhaka).padStart(2, "0"),
            String(p.segment).padStart(2, "0"),
          ].join(".");
        }),
      )
    : null;

  let segments = 0;
  let mantras = 0;
  for (const file of files) {
    if (wanted && !matchesTarget(file, wanted)) continue;
    const result = await transformOne(file);
    segments += 1;
    mantras += result.mantras;
  }
  console.log(`[Transform] segments=${segments} mantras=${mantras} → ${WORKSPACE_DIR}`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  transformKauthumaSamhita(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
