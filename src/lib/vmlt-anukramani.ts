import Sanscript from "@indic-transliteration/sanscript";
import { normalizeChandasLabel } from "./anukramani";

const IAST_METER_TO_DEVA: Array<[RegExp, string]> = [
  [/triṣṭubh/i, "त्रिष्टुभ्"],
  [/anuṣṭubh/i, "अनुष्टुभ्"],
  [/jagatī/i, "जगती"],
  [/gāyatrī/i, "गायत्री"],
  [/bṛhatī/i, "बृहती"],
  [/uṣṇik/i, "उष्णिक्"],
  [/virāj/i, "विराट्"],
  [/paṅkti/i, "पङ्क्ति"],
  [/atiśakvarī/i, "अतिशक्वरी"],
  [/aṣṭi/i, "अष्टि"],
  [/dhṛti/i, "धृति"],
];

/** Normalize VMLT roman prose before IAST transliteration. */
export function normalizeVmltRoman(text: string): string {
  return text
    .replace(/\(who\?\)/gi, "(कः?)")
    .replace(/\bkeśins\b/gi, "keśins")
    .replace(/\band other\b/gi, " इत्येते")
    .replace(/\bor\b/gi, " वा ")
    .replace(/’s\b/g, "s")
    .replace(/\([^)]*\bseven sons\b[^)]*\)/gi, "(अन्यतमः)")
    .replace(/\bformerly\b/gi, "पूर्वम्")
    .replace(/\bbrother and adoptive son of\b/gi, "भ्राता दत्तपुत्रश्च")
    .replace(/\bwife\b/gi, "पत्नी")
    .replace(/\bwho help in battle\b/gi, "")
    .replace(/\bhelp in battle\b/gi, "")
    .replace(/\balias of the\b/gi, "इत्यपरनाम")
    .replace(/\balias of\b/gi, "इत्यपरनाम")
    .replace(/\bthe\b/gi, "")
    .replace(/\bsages\b/gi, "ऋषयः")
    .replace(/\btogether\b/gi, "")
    .replace(/\bone of them\b/gi, "")
    .replace(/\blast two\b/gi, "")
    .replace(/\b\(a\)/gi, "(क)")
    .replace(/\b\(b\)/gi, "(ख)")
  // Strip remaining bare English tokens (no IAST diacritics).
    .replace(
      /\b(?:who|help|in|battle|and|of|one|them|two|last|english|long-haired|i\.e\.)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

export function romanAnukramaniToDevanagari(roman: string): string {
  return Sanscript.t(normalizeVmltRoman(roman), "iast", "devanagari");
}

/** Pick a sukta-level chandas label from VMLT `info.meters` prose. */
export function primaryChandasFromMeters(meters: string): string | null {
  const secondSet = /2nd set of styles:\s*([^.]+)/i.exec(meters);
  const section = secondSet?.[1] ?? meters;
  for (const [re, deva] of IAST_METER_TO_DEVA) {
    if (re.test(section)) return normalizeChandasLabel(deva);
  }
  return null;
}
