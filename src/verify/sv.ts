import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedSegmentSchema } from "../schema/sv";

/**
 * Alignment audit for Kauthuma Sāmaveda extract.
 *
 * Usage: bun run verify:sv
 */

const EXTRACTED_DIR = path.resolve("data/extracted/kauthuma-samhita");

const EXPECTED_MANTRAS_MIN = 1850;
const EXPECTED_SEGMENTS_MIN = 25;

export async function verifyKauthumaSamhita() {
  const rows: string[] = ["arcika.prapāṭhaka.segment\tkind\tmantras\theader"];
  let segments = 0;
  let mantras = 0;
  const notes: string[] = [];

  const arcikas = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const arcika of arcikas.sort()) {
    if (!/^\d{2}$/.test(arcika)) continue;
    for (const prap of (await fs.readdir(path.join(EXTRACTED_DIR, arcika))).sort()) {
      if (!/^\d{2}$/.test(prap)) continue;
      for (const file of (await fs.readdir(path.join(EXTRACTED_DIR, arcika, prap))).sort()) {
        if (!file.endsWith(".json")) continue;
        const seg = ExtractedSegmentSchema.parse(
          JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, arcika, prap, file), "utf8")),
        );
        segments += 1;
        mantras += seg.mantras.length;
        rows.push(
          `${seg.arcika}.${seg.prapāṭhaka}.${seg.segment}\t${seg.segment_kind}\t${seg.mantras.length}\t${seg.header ? "yes" : "no"}`,
        );
      }
    }
  }

  if (mantras < EXPECTED_MANTRAS_MIN) {
    notes.push(`mantra_count low expected>=${EXPECTED_MANTRAS_MIN} got=${mantras}`);
  }
  if (segments < EXPECTED_SEGMENTS_MIN) {
    notes.push(`segment_count low expected>=${EXPECTED_SEGMENTS_MIN} got=${segments}`);
  }

  const firstPath = path.join(EXTRACTED_DIR, "01", "01", "01.json");
  try {
    const first = ExtractedSegmentSchema.parse(JSON.parse(await fs.readFile(firstPath, "utf8")));
    const opening = first.mantras[0]?.samhita_devanagari ?? "";
    if (!opening.includes("ग्न")) {
      notes.push("missing_opening_01.01.01");
    }
  } catch {
    notes.push("missing_segment_01.01.01");
  }

  rows.push("");
  rows.push(`segments=${segments} mantras=${mantras}`);
  if (notes.length) {
    rows.push("notes:");
    rows.push(...notes);
  }
  const out = path.resolve("data/audit/kauthuma-samhita-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - (notes.length ? notes.length + 2 : 1)]);
  if (notes.length) console.log("[Verify] notes: " + notes.join("; "));
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyKauthumaSamhita().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
