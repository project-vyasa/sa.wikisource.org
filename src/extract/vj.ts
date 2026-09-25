import fs from "node:fs/promises";
import path from "node:path";
import { VJ_PAGE, vjSourceUrl } from "../crawl/vj";
import { ensureDir } from "../lib/wikimedia";
import { parseVedangaJyotisha, toExtractedChapter } from "./parse-vj";
import { readWikitextFromParseJson } from "./parse-tts";

const RAW_DIR = path.resolve("data/raw/vedanga-jyotisha");
const EXTRACTED_DIR = path.resolve("data/extracted/vedanga-jyotisha");
const AUDIT_PATH = path.resolve("data/audit/vedanga-jyotisha-extract.txt");

export async function extractVedangaJyotisha() {
  await ensureDir(EXTRACTED_DIR);
  await ensureDir(path.dirname(AUDIT_PATH));
  const raw = await fs.readFile(path.join(RAW_DIR, VJ_PAGE.file), "utf8");
  const chapters = parseVedangaJyotisha(readWikitextFromParseJson(raw));
  const audit: string[] = [];
  if (chapters.find((c) => c.chapter === "archa")?.verses.length !== 36) {
    audit.push("archa_not_36_on_ws");
  }
  for (const ch of chapters) {
    const out = toExtractedChapter(ch, vjSourceUrl(), VJ_PAGE.file);
    await fs.writeFile(path.join(EXTRACTED_DIR, `${out.chapter}.json`), JSON.stringify(out, null, 2) + "\n", "utf8");
    console.log(`[Extract] ${out.chapter}: ${out.verses.length} verse(s)`);
  }
  await fs.writeFile(AUDIT_PATH, audit.join("\n") + (audit.length ? "\n" : ""), "utf8");
  console.log(`[Extract] Audit: ${path.relative(process.cwd(), AUDIT_PATH)} (${audit.length} line(s))`);
}

if (import.meta.main) {
  extractVedangaJyotisha().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
