import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedAdhyayaSchema } from "../schema/pv";

const EXTRACTED_DIR = path.resolve("data/extracted/panchavimsha-brahmana");
const EXPECTED_ADHYAYAS = 25;

export async function verifyPanchavimshaBrahmana() {
  const rows: string[] = ["adhyaya\tsections"];
  const notes: string[] = [];
  let adhyayas = 0;
  let sections = 0;

  for (const file of (await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[])).sort()) {
    if (!file.endsWith(".json")) continue;
    const adhyaya = ExtractedAdhyayaSchema.parse(
      JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, file), "utf8")),
    );
    adhyayas += 1;
    sections += adhyaya.sections.length;
    rows.push(`${Number(adhyaya.adhyaya)}\t${adhyaya.sections.length}`);
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
  const out = path.resolve("data/audit/panchavimsha-brahmana-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - (notes.length ? notes.length + 2 : 1)]);
  if (notes.length) console.log("[Verify] notes: " + notes.join("; "));
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyPanchavimshaBrahmana().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
