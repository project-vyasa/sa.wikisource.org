import Sanscript from "@indic-transliteration/sanscript";

/** Fold IAST / Devanagari names to a comparable ASCII key. */
export function latinCompareKey(text: string): string {
  const latin = /[\u0900-\u097F]/.test(text)
    ? Sanscript.t(text, "devanagari", "iast")
    : text;
  return latin
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z]/g, "")
    .replace(/h$/, "");
}

export function devanagariToIast(text: string): string {
  return Sanscript.t(text, "devanagari", "iast");
}

function wordStemKey(word: string): string {
  return latinCompareKey(word).replace(/(sh?|s)$/, "");
}

/** Compare Devanagari or roman entity names with stem-tolerant token matching. */
export function fuzzyNamesMatch(
  ours: string | null | undefined,
  ref: string | null | undefined,
): boolean | null {
  if (!ours?.trim() || !ref?.trim()) return null;

  const refClean = ref.replace(/\band other\b/gi, "").trim();
  if (latinCompareKey(ours) === latinCompareKey(refClean)) return true;

  const ourLatin = /[\u0900-\u097F]/.test(ours)
    ? devanagariToIast(ours)
    : ours;
  const ourWords = ourLatin.split(/\s+/).filter(Boolean).map(wordStemKey);
  const refWords = refClean.split(/\s+/).filter(Boolean).map(wordStemKey);

  return refWords.every((rw) =>
    ourWords.some((ow) => ow === rw || ow.startsWith(rw) || rw.startsWith(ow)),
  );
}
