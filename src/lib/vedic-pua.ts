/**
 * Map Sanskrit 2003 / Itranslator private-use marks in sa.wikisource
 * Taittirīya dumps onto real Unicode. Noto (and most browsers) have no
 * glyphs for these PUA codepoints, so they render as tofu.
 *
 * Inventory from the two accented TTS dumps (2026-09-12):
 * F176 spacing svarita, E001/F156 anusvara, F131 visarga, E007 rare
 * floating udatta. F184/F1A2 appear only in English "Write a
 * description" header corruption.
 *
 * After mapping, Vedic tones (U+0951/U+0952) that sit *after* anusvara or
 * visarga have no letter to attach to. Noto then paints a dotted circle
 * (the empty-slot glyph). Move those tones in front of the sign.
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

const TONE_AFTER_SIGN = /([ंःँ]+)([॒॑]+)/gu;
const DUP_TONE = /([॒॑])\1+/gu;
const ORPHAN_TONE = /(^|[\s।॥])[॒॑]+/gu;
const DOTTED_CIRCLE = /\u25CC/gu;

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

/**
 * Attach Vedic udātta/anudātta to the preceding letter instead of
 * leaving them after anusvara/visarga (which renders as ◌ placeholders).
 */
export function reattachVedicTones(text: string): string {
  let out = text.replace(DOTTED_CIRCLE, "");
  let prev = "";
  while (out !== prev) {
    prev = out;
    out = out.replace(TONE_AFTER_SIGN, "$2$1");
  }
  out = out.replace(DUP_TONE, "$1");
  out = out.replace(ORPHAN_TONE, "$1");
  return out;
}

/** True when a dump block is English editor-placeholder, not Sanskrit. */
export function isLatinGarbage(text: string): boolean {
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const deva = (text.match(/[\u0900-\u097F]/g) ?? []).length;
  return latin >= 6 && latin > deva;
}

export function cleanVedicDumpText(text: string): string {
  return stripTrailingKhandaNumber(
    reattachVedicTones(dropLeftoverPua(mapVedicPua(text))).replace(WIKI_LINK, " "),
  );
}
