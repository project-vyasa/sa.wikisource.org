import fs from "node:fs/promises";
import path from "node:path";
import { pad2 } from "../lib/devanagari-numerals";
import { emitBlock } from "../lib/vy-emit";
import { ensureDir } from "../lib/wikimedia";
import {
  ExtractedPrasnaSchema,
  FEATURED_ANUVAKAS,
  FEATURED_PRASNAS,
  anuvakaTitle,
  prasnaTitle,
  type ExtractedPrasna,
} from "../schema/tta";

/**
 * Stage 3: Transform extracted TTA JSON into data/processed/taittiriya-aranyaka.
 *
 * Usage:
 *   bun run transform:tta
 *   bun run src/transform/tta.ts 5
 */

const EXTRACTED_DIR = path.resolve("data/extracted/taittiriya-aranyaka");
const WORKSPACE_DIR = path.resolve("data/processed/taittiriya-aranyaka");

function parseTarget(spec: string): number {
  const m = /^(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected praśna like 5`);
  return Number(m[1]);
}

function emitContext(prasna: ExtractedPrasna, anuvaka: string): string {
  return (
    "`set context {\n  prasna = \"" +
    prasna.prasna +
    "\",\n  anuvaka = \"" +
    anuvaka +
    "\",\n  prasna.title = \"" +
    prasnaTitle(prasna.prasna) +
    "\",\n  anuvaka.title = \"" +
    anuvakaTitle(prasna.prasna, anuvaka) +
    "\"\n}\n"
  );
}

function emitAnuvakaFile(prasna: ExtractedPrasna, anuvakaId: string): string {
  const anu = prasna.anuvakas.find((a) => a.anuvaka === anuvakaId);
  if (!anu) throw new Error("Missing anuvaka " + anuvakaId);
  const parts = [emitContext(prasna, anuvakaId)];
  for (const mantra of anu.mantras) {
    const n = Number.parseInt(mantra.mantra, 10);
    parts.push(emitBlock("mantra", n, mantra.samhita_devanagari, "TTA"));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

function annotatePrasna(prasna: ExtractedPrasna): string | null {
  const featured = FEATURED_PRASNAS[prasna.prasna];
  if (!featured) return null;
  const container = [Number(prasna.prasna), 0, 0].join(":");
  return "`annotate \"" + container + "\" { featured=" + featured.key + " }\n";
}

function annotateAnuvakas(prasna: ExtractedPrasna): string[] {
  const lines: string[] = [];
  for (const anu of prasna.anuvakas) {
    const featured = FEATURED_ANUVAKAS[`${prasna.prasna}.${anu.anuvaka}`];
    if (!featured) continue;
    const container = [Number(prasna.prasna), Number(anu.anuvaka), 0].join(":");
    lines.push("`annotate \"" + container + "\" { featured=" + featured.key + " }\n");
  }
  return lines;
}

async function listExtracted(): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const file of entries.sort()) {
    if (file.endsWith(".json")) files.push(path.join(EXTRACTED_DIR, file));
  }
  return files;
}

async function transformOne(filePath: string, featured: string[]) {
  const prasna = ExtractedPrasnaSchema.parse(
    JSON.parse(await fs.readFile(filePath, "utf8")),
  );
  let mantras = 0;
  for (const anu of prasna.anuvakas) {
    const dir = path.join(WORKSPACE_DIR, "content", "samhita", prasna.prasna);
    await ensureDir(dir);
    await fs.writeFile(
      path.join(dir, `${anu.anuvaka}.vy`),
      emitAnuvakaFile(prasna, anu.anuvaka),
      "utf8",
    );
    mantras += anu.mantras.length;
  }
  const line = annotatePrasna(prasna);
  if (line) featured.push(line);
  featured.push(...annotateAnuvakas(prasna));
  return { prasna: prasna.prasna, anuvakas: prasna.anuvakas.length, mantras };
}

export async function transformTaittiriyaAranyaka(targets?: string[]) {
  await ensureDir(path.join(WORKSPACE_DIR, "content"));
  let files: string[];
  if (targets?.length) {
    files = targets.map((spec) => path.join(EXTRACTED_DIR, `${pad2(parseTarget(spec))}.json`));
  } else {
    files = await listExtracted();
    console.log(`[Transform] Found ${files.length} extracted praśna JSON file(s).`);
  }

  const featured: string[] = [];
  let ok = 0;
  let failed = 0;
  for (const file of files) {
    try {
      const result = await transformOne(file, featured);
      ok += 1;
      console.log(
        `[Transform] ${result.prasna}: ${result.anuvakas} anuvāka(s), ${result.mantras} mantra(s)`,
      );
    } catch (err) {
      failed += 1;
      console.error(
        `[Transform] FAILED ${path.relative(process.cwd(), file)}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (!targets?.length) {
    const annDir = path.join(WORKSPACE_DIR, "annotations");
    await ensureDir(annDir);
    await fs.writeFile(
      path.join(annDir, "featured.vy"),
      featured.join("\n") + (featured.length ? "\n" : ""),
      "utf8",
    );
  }

  console.log(`[Transform] Done. ok=${ok} failed=${failed}`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  transformTaittiriyaAranyaka(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
