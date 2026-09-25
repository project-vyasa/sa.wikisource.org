import fs from "node:fs/promises";
import path from "node:path";
import { ExtractedChapterSchema } from "../schema/vj";

/**
 * Alignment audit for Vedāṅga Jyotiṣa extract.
 *
 * Usage: bun run verify:vj
 */

const EXTRACTED_DIR = path.resolve("data/extracted/vedanga-jyotisha");

/** Sanskrit Wikisource dump (2026-09): Ārca stops at 36; Yājuṣa has 43 numbered verses. */
const EXPECTED: Record<string, { verses: number; max: number; opening?: string }> = {
  archa: { verses: 36, max: 36, opening: "पञ्चसम्वत्सर" },
  yajusha: { verses: 43, max: 43, opening: "अथयाजुष" },
};

export async function verifyVedangaJyotisha() {
  const notes: string[] = [];
  let total = 0;
  const rows: string[] = ["chapter\tverses\tmax_id"];

  for (const file of (await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[])).sort()) {
    if (!file.endsWith(".json")) continue;
    const ch = ExtractedChapterSchema.parse(
      JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, file), "utf8")),
    );
    const nums = ch.verses.map((v) => Number.parseInt(v.verse, 10));
    const max = Math.max(...nums);
    const seen = new Set<number>();
    for (const n of nums) {
      if (seen.has(n)) notes.push(`duplicate_verse_${ch.chapter}_${n}`);
      seen.add(n);
    }
    total += ch.verses.length;
    rows.push(`${ch.chapter}\t${ch.verses.length}\t${max}`);

    const exp = EXPECTED[ch.chapter];
    if (exp) {
      if (ch.verses.length !== exp.verses) {
        notes.push(`${ch.chapter}_count expected=${exp.verses} got=${ch.verses.length}`);
      }
      if (max !== exp.max) {
        notes.push(`${ch.chapter}_max expected=${exp.max} got=${max}`);
      }
      if (exp.opening) {
        const first = ch.verses.find((v) => Number.parseInt(v.verse, 10) === 1)?.mula_devanagari ?? "";
        if (!first.includes(exp.opening)) {
          notes.push(`missing_opening_${ch.chapter}`);
        }
      }
    }
  }

  rows.push("", `verses=${total}`);
  if (notes.length) {
    rows.push("notes:");
    rows.push(...notes);
  }
  const out = path.resolve("data/audit/vedanga-jyotisha-verify.txt");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.log(rows[rows.length - (notes.length ? notes.length + 2 : 1)]);
  if (notes.length) console.log("[Verify] notes: " + notes.join("; "));
  console.log(`[Verify] Wrote ${path.relative(process.cwd(), out)}`);
}

if (import.meta.main) {
  verifyVedangaJyotisha().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
