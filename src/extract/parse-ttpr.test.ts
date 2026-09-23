import { describe, expect, it } from "bun:test";
import { parseAdhyayaSutras, parsePratisakhya } from "./parse-ttpr";

const ADHYAYA_1 = `
अथ वर्णसमाग्नायः १ अथ नवादितः समानाक्षराणि २ द्वेद्वे सवर्णे हस्वदीर्घे ३
नानापदवदिंग्यमसंख्याने ४२ तस्य पूर्वपदमवग्रहः ४९
इति प्रथमोऽध्यायः
`;

const PAGE = `
== प्रथमोध्यायः ==
अथ वर्णसमाग्नायः १ अथ नवादितः समानाक्षराणि २
== द्वितीयोध्यायः ==
अथ सकारपराः १ विकृतेऽपि २
`;

describe("parseAdhyayaSutras", () => {
  it("splits on Devanagari counters in source order and skips the colophon", () => {
    const sutras = parseAdhyayaSutras(ADHYAYA_1);
    expect(sutras[0]).toMatchObject({ sutra: "001", mula_devanagari: "अथ वर्णसमाग्नायः" });
    expect(sutras[1]?.mula_devanagari).toBe("अथ नवादितः समानाक्षराणि");
    expect(sutras.map((s) => s.sutra)).toEqual(["001", "002", "003", "004", "005"]);
    expect(sutras.at(-1)?.mula_devanagari).toContain("पूर्वपदमवग्रहः");
  });
});

describe("parsePratisakhya", () => {
  it("splits 24-style ==अध्यायः== headers into sequential adhyāyas", () => {
    const adhyayas = parsePratisakhya(PAGE, "https://sa.wikisource.org/wiki/x");
    expect(adhyayas).toHaveLength(2);
    expect(adhyayas[0]?.adhyaya).toBe("01");
    expect(adhyayas[0]?.sutras[0]?.mula_devanagari).toBe("अथ वर्णसमाग्नायः");
    expect(adhyayas[1]?.sutras).toHaveLength(2);
  });
});
