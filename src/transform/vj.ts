import fs from "node:fs/promises";
import path from "node:path";
import { emitBlock } from "../lib/vy-emit";
import { ensureDir } from "../lib/wikimedia";
import { ExtractedChapterSchema, type ExtractedChapter } from "../schema/vj";

const EXTRACTED_DIR = path.resolve("data/extracted/vedanga-jyotisha");
const WORKSPACE_DIR = path.resolve("data/processed/vedanga-jyotisha");

function emitContext(ch: ExtractedChapter): string {
  return (
    "`set context {\n" +
    `  chapter = "${ch.chapter}",\n` +
    `  chapter.title = "${ch.title.replace(/"/g, '\\"')}"\n` +
    "}\n"
  );
}

function emitChapterFile(ch: ExtractedChapter): string {
  const parts = [emitContext(ch)];
  for (const v of ch.verses) {
    parts.push(emitBlock("v", Number.parseInt(v.verse, 10), v.mula_devanagari, "VJ"));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

export async function transformVedangaJyotisha() {
  await ensureDir(path.join(WORKSPACE_DIR, "content", "sutra"));
  for (const file of (await fs.readdir(EXTRACTED_DIR)).sort()) {
    if (!file.endsWith(".json")) continue;
    const ch = ExtractedChapterSchema.parse(
      JSON.parse(await fs.readFile(path.join(EXTRACTED_DIR, file), "utf8")),
    );
    await fs.writeFile(
      path.join(WORKSPACE_DIR, "content", "sutra", `${ch.chapter}.vy`),
      emitChapterFile(ch),
      "utf8",
    );
    console.log(`[Transform] ${ch.chapter}: ${ch.verses.length} verse(s)`);
  }
}

if (import.meta.main) {
  transformVedangaJyotisha().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
