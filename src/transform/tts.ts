import fs from "node:fs/promises";
import path from "node:path";
import { pad2 } from "../lib/devanagari-numerals";
import { emitBlock } from "../lib/vy-emit";
import { ensureDir } from "../lib/wikimedia";
import {
  ExtractedPrasnaSchema,
  FEATURED_PRASNAS,
  featuredKey,
  prasnaTitle,
  type ExtractedPrasna,
} from "../schema/tts";

/**
 * Stage 3: Transform extracted TTS JSON into data/processed/taittiriya-samhita.
 *
 * Usage:
 *   bun run transform:tts
 *   bun run src/transform/tts.ts 1.1
 */

const EXTRACTED_DIR = path.resolve("data/extracted/taittiriya-samhita");
const WORKSPACE_DIR = path.resolve("data/processed/taittiriya-samhita");

function parseTarget(spec: string): { kanda: number; prasna: number } {
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected K.P like 1.1`);
  return { kanda: Number(m[1]), prasna: Number(m[2]) };
}

function emitContext(prasna: ExtractedPrasna, anuvaka: string): string {
  const k = Number.parseInt(prasna.kanda, 10);
  const p = Number.parseInt(prasna.prasna, 10);
  const a = Number.parseInt(anuvaka, 10);
  return (
    "`set context {\n  kanda = \"" +
    prasna.kanda +
    "\",\n  prasna = \"" +
    prasna.prasna +
    "\",\n  anuvaka = \"" +
    anuvaka +
    "\",\n  kanda.title = \"Kāṇḍa " +
    String(k) +
    "\",\n  prasna.title = \"" +
    prasnaTitle(prasna.kanda, prasna.prasna) +
    "\",\n  anuvaka.title = \"Anuvāka " +
    String(k) +
    "." +
    String(p) +
    "." +
    String(a) +
    "\"\n}\n"
  );
}

function emitAnuvakaFile(prasna: ExtractedPrasna, anuvakaId: string): string {
  const anu = prasna.anuvakas.find((a) => a.anuvaka === anuvakaId);
  if (!anu) throw new Error("Missing anuvaka " + anuvakaId);
  const parts = [emitContext(prasna, anuvakaId)];
  for (const mantra of anu.mantras) {
    const n = Number.parseInt(mantra.mantra, 10);
    parts.push(emitBlock("mantra", n, mantra.samhita_devanagari, "TTS"));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

function annotateRange(prasna: ExtractedPrasna): string | null {
  const featured = FEATURED_PRASNAS[featuredKey(prasna.kanda, prasna.prasna)];
  if (!featured) return null;
  // Pad to the 4-level hierarchy. UrnEncoder right-aligns short paths, so
  // "4:5" becomes 0:4:5 and never covers leaf 4:5:1:1. Trailing :0 is
  // stripped back to "4:5" when the viewer loads annotations.
  const container = [
    Number(prasna.kanda),
    Number(prasna.prasna),
    0,
    0,
  ].join(":");
  return "`annotate \"" + container + "\" { featured=" + featured.key + " }\n";
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

async function transformOne(filePath: string, featured: string[]) {
  const prasna = ExtractedPrasnaSchema.parse(
    JSON.parse(await fs.readFile(filePath, "utf8")),
  );
  let mantras = 0;
  for (const anu of prasna.anuvakas) {
    const dir = path.join(
      WORKSPACE_DIR,
      "content",
      "samhita",
      prasna.kanda,
      prasna.prasna,
    );
    await ensureDir(dir);
    await fs.writeFile(
      path.join(dir, `${anu.anuvaka}.vy`),
      emitAnuvakaFile(prasna, anu.anuvaka),
      "utf8",
    );
    mantras += anu.mantras.length;
  }
  const line = annotateRange(prasna);
  if (line) featured.push(line);
  return {
    kanda: prasna.kanda,
    prasna: prasna.prasna,
    anuvakas: prasna.anuvakas.length,
    mantras,
  };
}

export async function transformTaittiriyaSamhita(targets?: string[]) {
  await ensureDir(path.join(WORKSPACE_DIR, "content"));
  let files: string[];
  if (targets?.length) {
    files = targets.map((spec) => {
      const { kanda, prasna } = parseTarget(spec);
      return path.join(
        EXTRACTED_DIR,
        pad2(kanda),
        `${pad2(kanda)}-${pad2(prasna)}.json`,
      );
    });
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
        `[Transform] ${result.kanda}.${result.prasna}: ${result.anuvakas} anuvāka(s), ${result.mantras} mantra(s)`,
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
  transformTaittiriyaSamhita(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
