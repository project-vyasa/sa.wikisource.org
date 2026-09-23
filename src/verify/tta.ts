import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedPrasnaSchema } from "../schema/tta";

/**
 * Alignment audit for Taittirīya Āraṇyaka extract.
 *
 * Usage: bun run verify:tta
 */

const EXTRACTED_DIR = path.resolve("data/extracted/taittiriya-aranyaka");

const EXPECTED_PRASNAS = 8;

export async function verifyTaittiriyaAranyaka() {
  const rows: string[] = ["prasna\tanuvakas\tmantras\theader"];
  const notes: string[] = [];
  let prasnas = 0;
  let anuvakas = 0;
  let mantras = 0;
  const seen = new Set<number>();

  const files = (await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[])).sort();
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const prasna = ExtractedPrasnaSchema.parse(
      JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, file), "utf8")),
    );
    const nMantra = prasna.anuvakas.reduce((s, a) => s + a.mantras.length, 0);
    prasnas += 1;
    anuvakas += prasna.anuvakas.length;
    mantras += nMantra;
    seen.add(Number(prasna.prasna));
    rows.push(
      `${Number(prasna.prasna)}\t${prasna.anuvakas.length}\t${nMantra}\t${prasna.header ? "yes" : "no"}`,
    );

    if (prasna.prasna === "05") {
      const opening = prasna.anuvakas[0]?.mantras[0]?.samhita_devanagari ?? "";
      if (!opening.includes("शन्नो") && !opening.includes("शं नो") && !opening.includes("शन्नो॑")) {
        notes.push("missing_sikshavalli_5.1.1");
      }
    }
    if (prasna.prasna === "03") {
      const a12 = prasna.anuvakas.find((a) => a.anuvaka === "12");
      const opening = a12?.mantras[0]?.samhita_devanagari ?? "";
      if (!opening.includes("पुरुष") && !opening.includes("पूरुष") && !opening.includes("पुरु")) {
        notes.push("missing_purusha_3.12");
      }
    }
    if (prasna.prasna === "06") {
      const header = prasna.header ?? "";
      if (!header.includes("नारायण") && !header.includes("उपनिषत्")) {
        notes.push("missing_mahanarayana_header_6");
      }
    }
  }

  if (prasnas !== EXPECTED_PRASNAS) {
    notes.push(`prasna_count expected=${EXPECTED_PRASNAS} got=${prasnas} seen=${[...seen].sort((a, b) => a - b).join(",")}`);
  }

  rows.push("");
  rows.push(`prasnas=${prasnas} anuvakas=${anuvakas} mantras=${mantras}`);
  if (notes.length) {
    rows.push("notes:");
    rows.push(...notes);
  }
  const out = path.resolve("data/audit/taittiriya-aranyaka-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - (notes.length ? notes.length + 2 : 1)]);
  if (notes.length) console.log("[Verify] notes: " + notes.join("; "));
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyTaittiriyaAranyaka().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
