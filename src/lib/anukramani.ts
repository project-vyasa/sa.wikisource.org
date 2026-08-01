/** Canonical Rig Veda meters (sukta-level labels). */
export const CANONICAL_CHANDAS = new Set([
  "गायत्री",
  "त्रिष्टुभ्",
  "जगती",
  "अनुष्टुभ्",
  "उष्णिक्",
  "बृहती",
  "पङ्क्ति",
  "पंक्ति",
  "महापङ्क्ति",
  "विराट्",
  "विराज्",
  "अतिजगती",
  "अतिगायत्री",
  "अतिबृहती",
  "अतित्रिष्टुभ्",
  "अतिअनुष्टुभ्",
  "शक्वरी",
  "निचृत्",
  "ककुभ्",
  "सतोबृहती",
  "धृति",
]);

const GARBAGE_CHANDAS_RE =
  /^[०-९0-9]+(?:-[०-९0-9]+)?$|^(छ\.|षष्ठीवर्ज्यानां|उपरिष्टाज्ज्योतिः)$/u;

const METER_IN_TEXT_RE =
  /(गायत्र[^\s,।]*|त्रिष्टुभ[^\s,।]*|त्रिष्टुप्[^\s,।]*|जगती[^\s,।]*|जागत[^\s,।]*|अनुष्टुभ[^\s,।]*|अनुष्टुप्[^\s,।]*|पङ्क्ति[^\s,।]*|पंक्ति[^\s,।]*|उष्णिक[^\s,।]*|बृहती[^\s,।]*|विराट[^\s,।]*|धृति[^\s,।]*)/u;

export function normalizeChandasLabel(label: string): string {
  const patterns: Array<[RegExp, string]> = [
    [/गायत्र/u, "गायत्री"],
    [/त्रैष्टुभ|त्रिष्टुभ|त्रिष्टुप्/u, "त्रिष्टुभ्"],
    [/जगती|जागत/u, "जगती"],
    [/अनुष्टुभ|अनुष्टुप्/u, "अनुष्टुभ्"],
    [/पङ्क्ति|पंक्ति/u, "पङ्क्ति"],
    [/उष्णिक/u, "उष्णिक्"],
    [/बृहती/u, "बृहती"],
    [/विराट/u, "विराट्"],
    [/धृति/u, "धृति"],
  ];
  for (const [re, canonical] of patterns) {
    if (re.test(label)) return canonical;
  }
  return label.trim();
}

/** Strip list punctuation Wikisource anukramani cells often trail with. */
export function stripChandasNoise(value: string): string {
  return value
    .trim()
    .replace(/[,\s।]+$/u, "")
    .replace(/^[,\s।]+/u, "");
}

export function isVerseNumberToken(value: string): boolean {
  const core = stripChandasNoise(value);
  if (!core) return false;
  if (/^[०-९0-9]+(?:-[०-९0-9]+)?$/u.test(core)) return true;
  // Verse index lists: `१,२` or `१, २, ३`
  return /^[०-९0-9]+(?:[,\s]+[०-९0-9]+)+$/u.test(core);
}

export function isGarbageChandas(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  const v = stripChandasNoise(value);
  if (!v) return true;
  if (CANONICAL_CHANDAS.has(v)) return false;
  if (isVerseNumberToken(v)) return true;
  return GARBAGE_CHANDAS_RE.test(v);
}

/** First meter name mentioned in an anukramani table cell or intro prose. */
export function extractMeterFromProse(text: string): string | null {
  const m = METER_IN_TEXT_RE.exec(text);
  return m ? normalizeChandasLabel(m[1]) : null;
}

/** Normalize rishi/devata for duplicate-facet detection. */
export function normalizeAnukramaniKey(value: string): string {
  return value
    .trim()
    .replace(/[।|]+$/u, "")
    .replace(/\s+/g, " ");
}

export function suktaRef(mandala: string, sukta: string): string {
  return `${Number.parseInt(mandala, 10)}:${Number.parseInt(sukta, 10)}`;
}
