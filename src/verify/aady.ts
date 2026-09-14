import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedPadaSchema } from "../schema/aady";

/**
 * Alignment audit for Aṣṭādhyāyī extract.
 *
 * Usage: bun run verify:aady
 */

const EXTRACTED_DIR = path.resolve("data/extracted/ashtadhyayi");

export async function verifyAshtadhyayi() {
  const rows: string[] = [
    "adhyaya.pada\tsutras\tmissing_vyakhya\tmissing_udaharana",
  ];
  let sutras = 0;
  let missingV = 0;
  let missingU = 0;
  let padas = 0;

  const dirs = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const dir of dirs.sort()) {
    if (!/^\d{2}$/.test(dir)) continue;
    for (const file of (await fs.readdir(path.join(EXTRACTED_DIR, dir))).sort()) {
      if (!file.endsWith(".json")) continue;
      const pada = ExtractedPadaSchema.parse(
        JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, dir, file), "utf8")),
      );
      const mv = pada.sutras.filter((s) => !s.vyakhya_hindi).length;
      const mu = pada.sutras.filter((s) => !s.udaharana).length;
      padas += 1;
      sutras += pada.sutras.length;
      missingV += mv;
      missingU += mu;
      rows.push(
        `${Number(pada.adhyaya)}.${Number(pada.pada)}\t${pada.sutras.length}\t${mv}\t${mu}`,
      );
    }
  }

  rows.push("");
  rows.push(`padas=${padas} sutras=${sutras} missing_vyakhya=${missingV} missing_udaharana=${missingU}`);
  const out = path.resolve("data/audit/ashtadhyayi-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - 1]);
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyAshtadhyayi().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
