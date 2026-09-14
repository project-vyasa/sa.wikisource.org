/**
 * Map Sanskrit 2003 / Itranslator private-use marks in sa.wikisource
 * Taittirīya dumps onto real Unicode. Noto (and most browsers) have no
 * glyphs for these PUA codepoints, so they render as tofu.
 *
 * Inventory from the two accented TTS dumps (2026-09-12):
 * F176 spacing svarita, E001/F156 anusvara, F131 visarga, E007 rare
 * floating udatta. F184/F1A2 appear only in English "Write a
 * description" header corruption.
 */

const PUA_MAP: Record<string, string> = {
  "\uF176": "\u0951", // Vedic tone svarita
  "\uE001": "\u0902", // anusvara (candrabindu-virama in the dump font)
  "\uF156": "\u0902", // anusvara
  "\uF131": "\u0903", // visarga
  "\uE007": "\u0951", // floating udatta → svarita mark
};

const PUA_RE = /[\uE000-\uF8FF]/gu;

/** Wikisource running khaṇḍa number across the praśna, not the mantra id. */
const KHANDA_NUM = /\s*\[\d+\]\s*/gu;
const WIKI_LINK = /\[\[.*?\]\]/gsu;

export function mapVedicPua(text: string): string {
  let out = "";
  for (const ch of text) {
    out += PUA_MAP[ch] ?? ch;
  }
  return out;
}

export function stripTrailingKhandaNumber(text: string): string {
  return text.replace(KHANDA_NUM, " ").replace(/[ \t]+/g, " ").trim();
}

/** Drop leftover PUA so unknown marks do not become tofu. */
export function dropLeftoverPua(text: string): string {
  return text.replace(PUA_RE, "");
}

/** True when a dump block is English editor-placeholder, not Sanskrit. */
export function isLatinGarbage(text: string): boolean {
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const deva = (text.match(/[\u0900-\u097F]/g) ?? []).length;
  return latin >= 6 && latin > deva;
}

export function cleanVedicDumpText(text: string): string {
  return stripTrailingKhandaNumber(
    dropLeftoverPua(mapVedicPua(text)).replace(WIKI_LINK, " "),
  );
}
