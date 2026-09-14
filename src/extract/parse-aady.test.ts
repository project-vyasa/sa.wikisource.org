import { describe, expect, it } from "bun:test";
import {
  parseMaheshvaraFromMula,
  parseMaheshvaraWikitext,
  parseMulaAdhyaya,
  parseVyakhyaAdhyaya,
  alignPada,
} from "./parse-aady";

const MULA_1_1 = `
== भाग १.१ ==
१.१.१ वृद्धिरादैच् । १.१.२ अदेङ् गुणः । १.१.३ इको गुणवृद्धी ।
१.१.४ न धातुलोप आर्धधातुके । १.१.५ ग्क्ङिति च ।
`;

const VYAKHYA_1_1 = `
[१|१|१] वृद्धिरादैच् आकार " आ" व " ऐच्" " ऐ", " औ" की वृद्धि संज्ञा होती है। | भागः, त्यागः, यागः।
[१|१|२] अदेङ् गुणः अ, ए और ओ को गुण कहते हैं। | चेता, नेता, कर्ता।
[१|१|५] क्ङिति च - गित्, कित् और ङित् परे होने पर गुण और वृद्धि नहीं होती।
`;

describe("parseMulaAdhyaya", () => {
  it("splits dotted Devanagari ids on adhyāya 1 pāda 1", () => {
    const mula = parseMulaAdhyaya(MULA_1_1);
    expect(mula.get("01.01.001")).toBe("वृद्धिरादैच् ।");
    expect(mula.get("01.01.002")).toBe("अदेङ् गुणः ।");
    expect(mula.get("01.01.005")).toBe("ग्क्ङिति च ।");
    expect(mula.size).toBe(5);
  });
});

describe("parseVyakhyaAdhyaya + alignPada", () => {
  it("strips the mūla prefix and splits udāharaṇa after |", () => {
    const mula = parseMulaAdhyaya(MULA_1_1);
    const vyakhya = parseVyakhyaAdhyaya(VYAKHYA_1_1);
    const { pada, missingVyakhya } = alignPada({
      adhyaya: 1,
      pada: 1,
      mula,
      vyakhya,
      sourceUrls: {
        mula: "https://sa.wikisource.org/wiki/x",
        vyakhya: "https://sa.wikisource.org/wiki/y",
      },
    });

    expect(pada.sutras).toHaveLength(5);
    expect(pada.sutras[0]!.mula_devanagari).toBe("वृद्धिरादैच् ।");
    expect(pada.sutras[0]!.vyakhya_hindi).toContain("वृद्धि संज्ञा");
    expect(pada.sutras[0]!.vyakhya_hindi).not.toContain("वृद्धिरादैच्");
    expect(pada.sutras[0]!.udaharana).toBe("भागः, त्यागः, यागः।");
    expect(pada.sutras[1]!.udaharana).toContain("चेता");
    expect(pada.sutras[4]!.udaharana).toBeNull();
    expect(missingVyakhya).toEqual(["01.01.003", "01.01.004"]);
  });
});

describe("parseMaheshvaraFromMula", () => {
  it("reads the fourteen Śiva sūtras from the mūla प्रत्याहार section", () => {
    const parsed = parseMaheshvaraFromMula(
      "==प्रत्याहार सूत्र==\n<poem>\nअइउण् ।\nऋऌक् ।\nएओङ् ।\nऐऔच् ।\nहयवरट् ।\nलण् ।\nञमङणनम् ।\nझभञ् ।\nघढधष् ।\nजबगडदश् ।\nखफछठथचटतव् ।\nकपय् ।\nशषसर् ।\nहल् ।\n</poem>\n\n==भाग १.१==\n१.१.१ वृद्धिरादैच् ।\n",
      "https://sa.wikisource.org/wiki/x",
    );
    expect(parsed.sutras).toHaveLength(14);
    expect(parsed.sutras[0]!.text).toBe("अइउण्");
    expect(parsed.sutras[13]!.text).toBe("हल्");
  });
});

describe("parseMaheshvaraWikitext", () => {
  it("takes fourteen pratyāhāra sūtras", () => {
    const parsed = parseMaheshvaraWikitext(
      "अइउण् । ऋऌक् । एओङ् । ऐऔच् । हयवरट् । लण् । ञमङणनम् । झभञ् । घढधष् । जबगडदश् । खफछठथचटतव् । कपय् । शषसर् । हल् ।",
      "https://sa.wikisource.org/wiki/x",
    );
    expect(parsed.sutras).toHaveLength(14);
    expect(parsed.sutras[0]!.text).toBe("अइउण्");
    expect(parsed.sutras[13]!.text).toBe("हल्");
  });
});
