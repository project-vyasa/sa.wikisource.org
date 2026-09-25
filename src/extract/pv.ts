import fs from "node:fs/promises";
import path from "node:path";
import { listPvAdhyayaSlugs, pvSourceUrl } from "../crawl/pv";
import { pad2 } from "../lib/devanagari-numerals";
import { adhyayaSlugToNumber } from "../lib/wikisource-index";
import { ensureDir } from "../lib/wikimedia";
import { parseBrahmanaProseAdhyaya } from "./parse-brahmana-prose";
import { readWikitextFromParseJson } from "./parse-tts";

/**
 * Stage 2: Extract Pañcaviṃśa Brāhmaṇa JSON from cached adhyāya wikitext.
 *
 * Usage:
 *   bun run extract:pv
 *   bun run src/extract/pv.ts 1
 */

const RAW_DIR = path.resolve("data/raw/panchavimsha-brahmana");
const EXTRACTED_DIR = path.resolve("data/extracted/panchavimsha-brahmana");
const AUDIT_PATH = path.resolve("data/audit/panchavimsha-brahmana-extract.txt");

function parseTarget(spec: string): number {
  const m = /^(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected adhyāya like 1`);
  return Number(m[1]);
}

export async function extractPanchavimshaBrahmana(targets?: string[]) {
  await ensureDir(EXTRACTED_DIR);
  await ensureDir(path.dirname(AUDIT_PATH));

  const wanted = targets?.length ? new Set(targets.map(parseTarget)) : null;
  const slugs = await listPvAdhyayaSlugs();

  const audit: string[] = [];
  let adhyayas = 0;
  let sections = 0;

  for (const slug of slugs) {
    const n = adhyayaSlugToNumber(slug);
    if (wanted && !wanted.has(n)) continue;

    const file = path.join(RAW_DIR, "wikitext", `adhyaya-${pad2(n)}.wikitext.json`);
    const raw = await fs.readFile(file, "utf8");
    const parsed = parseBrahmanaProseAdhyaya(readWikitextFromParseJson(raw));
    const body = {
      source_url: pvSourceUrl(slug),
      source_file: `adhyaya-${pad2(n)}.wikitext.json`,
      adhyaya: pad2(n),
      sections: parsed.map((s) => ({
        section: pad2(s.section),
        title: s.title,
        body: s.body,
      })),
    };

    if (body.sections.length === 0) audit.push(`empty_adhyaya ${n}`);

    await fs.writeFile(path.join(EXTRACTED_DIR, `${body.adhyaya}.json`), JSON.stringify(body, null, 2) + "\n", "utf8");
    adhyayas += 1;
    sections += body.sections.length;
    console.log(`[Extract] ${n}: ${body.sections.length} section(s)`);
  }

  await fs.writeFile(AUDIT_PATH, audit.join("\n") + (audit.length ? "\n" : ""), "utf8");
  console.log(`[Extract] Done. adhyayas=${adhyayas} sections=${sections}`);
  console.log(`[Extract] Audit: ${path.relative(process.cwd(), AUDIT_PATH)} (${audit.length} line(s))`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  extractPanchavimshaBrahmana(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
