import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedPrasnaSchema } from "../schema/tts";

/**
 * Alignment audit for Taittirīya Saṃhitā extract.
 *
 * Usage: bun run verify:tts
 */

const EXTRACTED_DIR = path.resolve("data/extracted/taittiriya-samhita");

const EXPECTED_PRASNAS: Record<number, number> = {
  1: 8,
  2: 6,
  3: 5,
  4: 7,
  5: 7,
  6: 6,
  7: 5,
};

export async function verifyTaittiriyaSamhita() {
  const rows: string[] = ["kanda.prasna\tanuvakas\tmantras\theader"];
  const byKanda = new Map<number, number>();
  let prasnas = 0;
  let anuvakas = 0;
  let mantras = 0;
  const notes: string[] = [];

  const dirs = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const dir of dirs.sort()) {
    if (!/^\d{2}$/.test(dir)) continue;
    for (const file of (await fs.readdir(path.join(EXTRACTED_DIR, dir))).sort()) {
      if (!file.endsWith(".json")) continue;
      const prasna = ExtractedPrasnaSchema.parse(
        JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, dir, file), "utf8")),
      );
      const nMantra = prasna.anuvakas.reduce((s, a) => s + a.mantras.length, 0);
      prasnas += 1;
      anuvakas += prasna.anuvakas.length;
      mantras += nMantra;
      byKanda.set(Number(prasna.kanda), (byKanda.get(Number(prasna.kanda)) ?? 0) + 1);
      rows.push(
        `${Number(prasna.kanda)}.${Number(prasna.prasna)}\t${prasna.anuvakas.length}\t${nMantra}\t${prasna.header ? "yes" : "no"}`,
      );

      if (prasna.kanda === "01" && prasna.prasna === "01") {
        const opening = prasna.anuvakas[0]?.mantras[0]?.samhita_devanagari ?? "";
        if (!opening.includes("इषे त्वो") && !opening.includes("इ॒षे त्वो")) {
          notes.push("missing_opening_1.1.1");
        }
      }
      if (prasna.kanda === "04" && prasna.prasna === "05") {
        const opening = prasna.anuvakas[0]?.mantras[0]?.samhita_devanagari ?? "";
        if (!opening.includes("रुद्र")) notes.push("missing_rudram_4.5.1");
      }
      if (prasna.kanda === "04" && prasna.prasna === "07") {
        const opening = prasna.anuvakas[0]?.mantras[0]?.samhita_devanagari ?? "";
        if (!opening.includes("मे") && !opening.includes("च मे") && !opening.includes("म॒")) {
          notes.push("camakam_4.7.1_unrecognized");
        }
      }
    }
  }

  for (const [kanda, expected] of Object.entries(EXPECTED_PRASNAS)) {
    const got = byKanda.get(Number(kanda)) ?? 0;
    if (got !== expected) {
      notes.push(`prasna_count_kanda_${kanda} expected=${expected} got=${got}`);
    }
  }

  rows.push("");
  rows.push(
    `kandas=${byKanda.size} prasnas=${prasnas} anuvakas=${anuvakas} mantras=${mantras}`,
  );
  if (notes.length) {
    rows.push("notes:");
    rows.push(...notes);
  }
  const out = path.resolve("data/audit/taittiriya-samhita-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - (notes.length ? notes.length + 2 : 1)]);
  if (notes.length) console.log("[Verify] notes: " + notes.join("; "));
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyTaittiriyaSamhita().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
