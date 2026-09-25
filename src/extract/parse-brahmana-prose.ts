import { devanagariToArabic } from "../lib/devanagari-numerals";
import { normalizePara } from "../lib/html-text";
import { cleanVedicDumpText, isLatinGarbage } from "../lib/vedic-pua";

const SKIP_LINE = /^\{\{|^\|}|^<inputbox|^type=|^\[\[\/अध्यायः|^\[\[वर्गः|^\*?\[\[/;
const SECTION_HEADER = /^([०-९0-9]+)\.([०-९0-9]+)\s*(.*)$/;

export interface BrahmanaSection {
  adhyaya: number;
  section: number;
  title: string | null;
  body: string;
}

function stripMarkup(line: string): string {
  return line.replace(/<[^>]*>/g, "").trim();
}

function cleanBody(text: string): string {
  return normalizePara(cleanVedicDumpText(text.replace(/<\/?[a-zA-Z][^>]*>/g, " ").trim()));
}

/**
 * Parse Taittirīya-style prose brāhmaṇa adhyāya pages:
 * `१.१ optional title` then continuation lines until the next `A.S` header.
 */
export function parseBrahmanaProseAdhyaya(wikitext: string): BrahmanaSection[] {
  const sections: BrahmanaSection[] = [];
  let current: BrahmanaSection | null = null;
  const pending: string[] = [];

  function flush() {
    if (!current) return;
    const body = cleanBody(pending.join(" "));
    pending.length = 0;
    if (body && !isLatinGarbage(body)) {
      sections.push({ ...current, body });
    }
    current = null;
  }

  for (const raw of wikitext.split(/\n/)) {
    const line = stripMarkup(raw);
    if (!line || SKIP_LINE.test(line)) continue;

    const header = SECTION_HEADER.exec(line);
    if (header) {
      flush();
      const adhyaya = Number(devanagariToArabic(header[1]!));
      const section = Number(devanagariToArabic(header[2]!));
      const tail = header[3]!.trim();
      const title =
        tail && tail.length <= 64 && !tail.includes("।") && !tail.includes("|") ? tail : null;
      if (!Number.isFinite(adhyaya) || !Number.isFinite(section)) continue;
      current = { adhyaya, section, title, body: "" };
      if (tail && !title) pending.push(tail);
      continue;
    }

    if (current) pending.push(line);
  }
  flush();
  return sections;
}
