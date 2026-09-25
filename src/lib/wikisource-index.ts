import { devanagariToArabic } from "./devanagari-numerals";

/** Parse `[[/अध्यायः …|…]]` or `[[/अध्यायः …]]` links from a Wikisource index page. */
export function parseAdhyayaIndexLinks(
  wikitext: string,
  linkPrefix = "/अध्यायः ",
): string[] {
  const re = new RegExp(
    `\\[\\[${linkPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\]|]+)`,
    "gu",
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of wikitext.matchAll(re)) {
    const slug = m[1]!.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

export function adhyayaSlugToNumber(slug: string): number {
  return Number(devanagariToArabic(slug.trim()));
}
