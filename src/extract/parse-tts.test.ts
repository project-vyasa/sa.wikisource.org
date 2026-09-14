import { describe, expect, it } from "bun:test";
import { groupPrasnas, parseDumpRecords } from "./parse-tts";

const SAMPLE = `
<pre>
1.1.0.0
तैत्तिरीय संहिता प्रथमकाण्डे प्रथमः प्रश्नः ।। हरिः ओम् ।।
1.1.0.0
<इ॒षे त्वा॑ य॒ज्ञस्य॒ शुन्ध॑ध्वं॒ कर्म॑णे ।।14।।>
1.1.1.0
<इ॒षे त्रिच॑त्वारिशत् । (1)>
1.1.1.1
इ॒षे त्वो॒र्जे त्वा॑ वा॒यव॑स्स्थोपा॒यव॑स्स्थ दे॒वो व॑स्सवि॒ता ।। [1]
1.1.2.0
<स॒हस्र॑वल््शा अ॒ष्टात्रि॑शच्च । (2)>
1.1.2.1
य॒ज्ञस्य॑ घो॒षद॑सि॒ प्रत्यु॑ष्ट॒॒ रक्षः॑ ।। [2]
4.5.0.0
तैत्तिरीयसंहिता चतुर्थकाण्डे पञ्चमः प्रश्नः ।।
4.5.1.0
<शतरुद्रीयम्>
4.5.1.1
नम॑स्ते रुद्र मन्यवे ।
5.5.14.0
Write a description about anuvaka
</pre>
`;

describe("parseDumpRecords", () => {
  it("splits on four-part line ids and keeps accented mantra text", () => {
    const recs = parseDumpRecords(SAMPLE);
    expect(recs.some((r) => r.kanda === 1 && r.prasna === 1 && r.anuvaka === 0 && r.mantra === 0)).toBe(true);
    const first = recs.find((r) => r.kanda === 1 && r.prasna === 1 && r.anuvaka === 1 && r.mantra === 1);
    expect(first?.body).toContain("इ॒षे त्वो॒र्जे त्वा॑");
    expect(recs.some((r) => r.kanda === 5 && r.prasna === 5 && r.anuvaka === 14)).toBe(false);
    expect(first?.body).not.toMatch(/\[\d+\]/);
    const cue = recs.find((r) => r.kanda === 1 && r.prasna === 1 && r.anuvaka === 1 && r.mantra === 0);
    expect(cue?.body).toContain("ंशत्");
    expect(cue?.body).not.toMatch(/[\uE000-\uF8FF]/u);
  });
});

describe("groupPrasnas", () => {
  it("drops 0.0 / A.0 ids as leaves and groups mantras under anuvākas", () => {
    const prasnas = groupPrasnas(parseDumpRecords(SAMPLE), () => "https://sa.wikisource.org/wiki/x");
    expect(prasnas).toHaveLength(2);

    const p11 = prasnas[0]!;
    expect(p11.kanda).toBe("01");
    expect(p11.prasna).toBe("01");
    expect(p11.header).toContain("प्रथमः प्रश्नः");
    expect(p11.anuvakas).toHaveLength(2);
    expect(p11.anuvakas[0]!.anuvaka).toBe("01");
    expect(p11.anuvakas[0]!.header).toContain("त्रिच");
    expect(p11.anuvakas[0]!.mantras).toHaveLength(1);
    expect(p11.anuvakas[0]!.mantras[0]!.mantra).toBe("01");
    expect(p11.anuvakas[0]!.mantras[0]!.samhita_devanagari).toContain("इ॒षे त्वो॒र्जे");

    const rudram = prasnas[1]!;
    expect(rudram.kanda).toBe("04");
    expect(rudram.prasna).toBe("05");
    expect(rudram.anuvakas[0]!.mantras[0]!.samhita_devanagari).toContain("रुद्र");
  });
});
