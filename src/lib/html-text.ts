import { collapseFalseDoubleDanda } from "./danda";

export function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function normalizePara(text: string): string {
  return collapseFalseDoubleDanda(
    decodeEntities(text)
      .replace(/[ \t]+/g, " ")
      .replace(/\n+/g, "\n")
      .trim(),
  );
}
