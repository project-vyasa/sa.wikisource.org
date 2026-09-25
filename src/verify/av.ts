import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedSuktaSchema } from "../schema/av";

/**
 * Alignment audit for Atharvaveda Śaunaka extract.
 *
 * Usage: bun run verify:av
 */

const EXTRACTED_DIR = path.resolve("data/extracted/atharvaveda-saunaka");

const KANDA1_SUKTA_COUNT = 35;
const KANDA1_RIK_COUNT = 153;

export async function verifyAtharvavedaSaunaka() {
  const rows: string[] = ["kanda.sukta\triks"];
  let suktas = 0;
  let riks = 0;
  let kanda1Suktas = 0;
  let kanda1Riks = 0;
  const notes: string[] = [];

  const kandas = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const kanda of kandas.sort()) {
    if (!/^\d{2}$/.test(kanda)) continue;
    for (const file of (await fs.readdir(path.join(EXTRACTED_DIR, kanda))).sort()) {
      if (!file.endsWith(".json")) continue;
      const sukta = ExtractedSuktaSchema.parse(
        JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, kanda, file), "utf8")),
      );
      suktas += 1;
      riks += sukta.riks.length;
      rows.push(`${Number(sukta.kanda)}.${Number(sukta.sukta)}\t${sukta.riks.length}`);
      if (sukta.kanda === "01") {
        kanda1Suktas += 1;
        kanda1Riks += sukta.riks.length;
      }
    }
  }

  if (kanda1Suktas && kanda1Suktas !== KANDA1_SUKTA_COUNT) {
    notes.push(`kanda1_suktas expected=${KANDA1_SUKTA_COUNT} got=${kanda1Suktas}`);
  }
  if (kanda1Riks && kanda1Riks !== KANDA1_RIK_COUNT) {
    notes.push(`kanda1_riks expected=${KANDA1_RIK_COUNT} got=${kanda1Riks}`);
  }

  rows.push("");
  rows.push(`kandas=${kandas.length} suktas=${suktas} riks=${riks}`);
  if (notes.length) {
    rows.push("notes:");
    rows.push(...notes);
  }
  const out = path.resolve("data/audit/atharvaveda-saunaka-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - (notes.length ? notes.length + 2 : 1)]);
  if (notes.length) console.log("[Verify] notes: " + notes.join("; "));
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyAtharvavedaSaunaka().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
