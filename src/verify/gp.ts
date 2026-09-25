import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedUnitSchema } from "../schema/gp";

/**
 * Alignment audit for Gopatha Brāhmaṇa extract.
 *
 * Usage: bun run verify:gp
 */

const EXTRACTED_DIR = path.resolve("data/extracted/gopatha-brahmana");

/** Wikisource dump (2026-09) contains kāṇḍas 1–2 only. */
const EXPECTED_KANDAS = 2;
const EXPECTED_UNITS_MIN = 250;

export async function verifyGopathaBrahmana() {
  const rows: string[] = ["kanda.unit\tpadas"];
  const notes: string[] = [];
  let units = 0;
  let padas = 0;
  const kandas = new Set<number>();

  for (const kandaDir of (await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[])).sort()) {
    if (!/^\d{2}$/.test(kandaDir)) continue;
    kandas.add(Number(kandaDir));
    for (const file of (await fs.readdir(path.join(EXTRACTED_DIR, kandaDir))).sort()) {
      if (!file.endsWith(".json")) continue;
      const unit = ExtractedUnitSchema.parse(
        JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, kandaDir, file), "utf8")),
      );
      units += 1;
      padas += unit.padas.length;
      rows.push(
        `${Number(unit.kanda)}.${Number(unit.prapathaka)}.${Number(unit.kandika)}\t${unit.padas.length}`,
      );
    }
  }

  if (kandas.size !== EXPECTED_KANDAS) {
    notes.push(`kanda_count expected=${EXPECTED_KANDAS} got=${kandas.size}`);
  }
  if (units < EXPECTED_UNITS_MIN) {
    notes.push(`unit_count low expected>=${EXPECTED_UNITS_MIN} got=${units}`);
  }

  const k1 = await fs
    .readFile(path.join(EXTRACTED_DIR, "01", "01-01.json"), "utf8")
    .catch(() => null);
  if (k1) {
    const u = ExtractedUnitSchema.parse(JSON.parse(k1));
    const first = u.padas[0]?.body ?? "";
    if (!first.includes("ब्रह्म")) notes.push("missing_opening_1.1.1");
  }

  rows.push("");
  rows.push(`kandas=${kandas.size} units=${units} padas=${padas}`);
  if (notes.length) {
    rows.push("notes:");
    rows.push(...notes);
  }
  const out = path.resolve("data/audit/gopatha-brahmana-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - (notes.length ? notes.length + 2 : 1)]);
  if (notes.length) console.log("[Verify] notes: " + notes.join("; "));
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyGopathaBrahmana().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
