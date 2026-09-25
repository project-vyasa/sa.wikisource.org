import fs from "node:fs/promises";
import path from "node:path";
import { pad2 } from "../lib/devanagari-numerals";
import { emitBlock } from "../lib/vy-emit";
import { ensureDir } from "../lib/wikimedia";
import { ExtractedAdhyayaSchema, type ExtractedAdhyaya } from "../schema/kb";

/**
 * Stage 3: Transform extracted KB JSON into data/processed/kaushitaki-brahmana.
 *
 * Usage:
 *   bun run transform:kb
 *   bun run src/transform/kb.ts 1
 */

const EXTRACTED_DIR = path.resolve("data/extracted/kaushitaki-brahmana");
const WORKSPACE_DIR = path.resolve("data/processed/kaushitaki-brahmana");

function parseTarget(spec: string): number {
  const m = /^(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected adhyāya like 1`);
  return Number(m[1]);
}

function emitContext(adhyaya: ExtractedAdhyaya, section: string, title: string | null): string {
  const a = Number.parseInt(adhyaya.adhyaya, 10);
  const s = Number.parseInt(section, 10);
  const sectionTitle = title?.trim() || `Section ${a}.${s}`;
  return (
    "`set context {\n" +
    `  adhyaya = "${adhyaya.adhyaya}",\n` +
    `  section = "${section}",\n` +
    `  adhyaya.title = "Adhyāya ${a}",\n` +
    `  section.title = "${sectionTitle.replace(/"/g, '\\"')}"\n` +
    "}\n"
  );
}

function emitSectionFile(adhyaya: ExtractedAdhyaya, sectionId: string, body: string, title: string | null): string {
  const n = Number.parseInt(sectionId, 10);
  const parts = [emitContext(adhyaya, sectionId, title), emitBlock("p", n, body, "KB"), ""];
  return parts.join("\n").trimEnd() + "\n";
}

async function listExtracted(): Promise<string[]> {
  const files: string[] = [];
  for (const file of (await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[])).sort()) {
    if (file.endsWith(".json")) files.push(path.join(EXTRACTED_DIR, file));
  }
  return files;
}

async function transformOne(filePath: string) {
  const adhyaya = ExtractedAdhyayaSchema.parse(JSON.parse(await fs.readFile(filePath, "utf8")));
  const dir = path.join(WORKSPACE_DIR, "content", "samhita", adhyaya.adhyaya);
  await ensureDir(dir);
  for (const section of adhyaya.sections) {
    await fs.writeFile(
      path.join(dir, `${section.section}.vy`),
      emitSectionFile(adhyaya, section.section, section.body, section.title),
      "utf8",
    );
  }
  return { adhyaya: adhyaya.adhyaya, sections: adhyaya.sections.length };
}

export async function transformKaushitakiBrahmana(targets?: string[]) {
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
  let sections = 0;
  for (const file of files) {
    try {
      const result = await transformOne(file);
      ok += 1;
      sections += result.sections;
      console.log(`[Transform] ${result.adhyaya}: ${result.sections} section(s)`);
    } catch (err) {
      failed += 1;
      console.error(
        `[Transform] FAILED ${path.relative(process.cwd(), file)}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  console.log(`[Transform] Done. ok=${ok} failed=${failed} sections=${sections}`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  transformKaushitakiBrahmana(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
