import { normalizeChandasLabel } from "./anukramani";

/** IAST meter substring → canonical entity key + Devanagari label. */
const IAST_METER_TABLE: Array<{ re: RegExp; key: string; deva: string }> = [
  { re: /\bkṛti\b/i, key: "kriti", deva: "कृति" },
  { re: /gāyatrī|gāyatri/i, key: "gayatri", deva: "गायत्री" },
  { re: /triṣṭubh|triṣṭup|triṣṭub/i, key: "trishtubh", deva: "त्रिष्टुभ्" },
  { re: /jagatī|jagati/i, key: "jagati", deva: "जगती" },
  { re: /anuṣṭubh|anuṣṭup/i, key: "anushtubh", deva: "अनुष्टुभ्" },
  { re: /uṣṇik|uṣṇih/i, key: "ushnik", deva: "उष्णिक्" },
  { re: /satobṛhatī|satobṛhati/i, key: "satobrihati", deva: "सतोबृहती" },
  { re: /urobṛhatī|urobṛhati/i, key: "urobrihati", deva: "उरोबृहती" },
  { re: /upariṣṭādbṛhatī/i, key: "uparishtadbrihati", deva: "उपरिष्टाद्बृहती" },
  { re: /bṛhatī|bṛhati/i, key: "brihati", deva: "बृहती" },
  { re: /mahāpaṅkti|mahapankti/i, key: "mahapankti", deva: "महापङ्क्ति" },
  { re: /śakvarī|sakvari/i, key: "shakvari", deva: "शक्वरी" },
  { re: /dvipadā|dvipada/i, key: "dvipada", deva: "द्विपदा" },
  { re: /virāj|virāṭ/i, key: "viraj", deva: "विराट्" },
  { re: /paṅkti|pankti/i, key: "pankti", deva: "पङ्क्ति" },
  { re: /nicṛt/i, key: "nicrit", deva: "निचृत्" },
  { re: /atiśakvarī/i, key: "atishakvari", deva: "अतिशक्वरी" },
  { re: /aṣṭi/i, key: "ashti", deva: "अष्टि" },
  { re: /dhṛti/i, key: "dhriti", deva: "धृति" },
];

export function chandasKeyFromMeterProse(meterProse: string): {
  key: string;
  label: string;
} | null {
  const text = meterProse.trim();
  if (!text) return null;
  for (const row of IAST_METER_TABLE) {
    if (row.re.test(text)) {
      return { key: row.key, label: normalizeChandasLabel(row.deva) };
    }
  }
  return null;
}
