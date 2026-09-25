import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedAdhyayaSchema } from "../schema/kb";

/**
 * Alignment audit for Kaushitaki Brāhmaṇa extract.
 *
 * Usage: bun run verify:kb
 */

const EXTRACTED_DIR = path.resolve("data/extracted/kaushitaki-brahmana");

const EXPECTED_ADHYAYAS = 30;

export async function verifyKaushitakiBrahmana() {
  const rows: string[] = ["adhyaya\tsections"];
  const notes: string[] = [];
  let adhyayas = 0;
  let sections = 0;

  const files = (await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[])).sort();
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const adhyaya = ExtractedAdhyayaSchema.parse(
      JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, file), "utf8")),
    );
    adhyayas += 1;
    sections += adhyaya.sections.length;
    rows.push(`${Number(adhyaya.adhyaya)}\t${adhyaya.sections.length}`);

    if (adhyaya.adhyaya === "01") {
      const first = adhyaya.sections[0]?.body ?? "";
      if (!first.includes("अस्मिन् वै लोक")) notes.push("missing_opening_1.1");
    }
  }

  if (adhyayas !== EXPECTED_ADHYAYAS) {
    notes.push(`adhyaya_count expected=${EXPECTED_ADHYAYAS} got=${adhyayas}`);
  }

  rows.push("");
  rows.push(`adhyayas=${adhyayas} sections=${sections}`);
  if (notes.length) {
    rows.push("notes:");
    rows.push(...notes);
  }
  const out = path.resolve("data/audit/kaushitaki-brahmana-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - (notes.length ? notes.length + 2 : 1)]);
  if (notes.length) console.log("[Verify] notes: " + notes.join("; "));
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyKaushitakiBrahmana().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
