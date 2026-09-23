import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedAdhyayaSchema } from "../schema/ttpr";

/**
 * Alignment audit for Taittirīya-Prātiśākhya extract.
 *
 * Usage: bun run verify:ttpr
 */

const EXTRACTED_DIR = path.resolve("data/extracted/taittiriya-pratisakhya");

const EXPECTED_ADHYAYAS = 24;

export async function verifyTaittiriyaPratisakhya() {
  const rows: string[] = ["adhyaya\tsutras"];
  const notes: string[] = [];
  let adhyayas = 0;
  let sutras = 0;

  const files = (await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[])).sort();
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const adhyaya = ExtractedAdhyayaSchema.parse(
      JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, file), "utf8")),
    );
    adhyayas += 1;
    sutras += adhyaya.sutras.length;
    rows.push(`${Number(adhyaya.adhyaya)}\t${adhyaya.sutras.length}`);

    if (adhyaya.adhyaya === "01") {
      const first = adhyaya.sutras[0]?.mula_devanagari ?? "";
      if (!first.includes("वर्णसमाग्नायः")) notes.push("missing_opening_1.1");
    }
  }

  if (adhyayas !== EXPECTED_ADHYAYAS) {
    notes.push(`adhyaya_count expected=${EXPECTED_ADHYAYAS} got=${adhyayas}`);
  }

  rows.push("");
  rows.push(`adhyayas=${adhyayas} sutras=${sutras}`);
  if (notes.length) {
    rows.push("notes:");
    rows.push(...notes);
  }
  const out = path.resolve("data/audit/taittiriya-pratisakhya-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - (notes.length ? notes.length + 2 : 1)]);
  if (notes.length) console.log("[Verify] notes: " + notes.join("; "));
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyTaittiriyaPratisakhya().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
