import { describe, expect, it } from "bun:test";
import { parseDumpRecords } from "./parse-tts";
import { groupTtaPrasnas } from "./parse-tta";

const SAMPLE = `
<pre>
1.0.0
तैत्तिरीयारण्यके प्रथमः प्रश्नः ।
1.1.0
<इ॒षे>
1.1.1
भ॒द्रं कर्णे॑भिः शृणु॒याम॑ देवाः ।
2.19.1
ध्रु॒वस्त्वम॑सि ।
0.0
चित्तिः॑ पृथि॒व्य॑ग्निः सहस्रशीर्षा ।
12.0
पूरु॑षः पु॒रोऽग्र॒तः ।
12.1
स॒हस्र॑शीर््षा॒ पुरु॑षः । स॒ह॒स्रा॒क्षः ।
4.0.0
चतुर्थःप्रश्नःप्रारंभः
4.1.1
प॒रे॒यु॒वासम् ।
5.0.0
तैत्तिरीयोपनिषत्
5.1.1
शन्नो॑ मि॒त्रः ।
</pre>
`;

describe("parseDumpRecords TTA 3-part", () => {
  it("promotes 2-part ids to praśna 3 and keeps 3-part prasna.anuvaka.mantra", () => {
    const recs = parseDumpRecords(SAMPLE, { parts: 3, twoPartPrasna: 3 });
    const p1 = recs.find((r) => r.prasna === 1 && r.anuvaka === 1 && r.mantra === 1);
    expect(p1?.body).toContain("भ॒द्रं कर्णे");
    const purusha = recs.find((r) => r.prasna === 3 && r.anuvaka === 12 && r.mantra === 1);
    expect(purusha?.body).toContain("पुरु");
    expect(recs.some((r) => r.prasna === 12)).toBe(false);
    const siksha = recs.find((r) => r.prasna === 5 && r.anuvaka === 1 && r.mantra === 1);
    expect(siksha?.body).toContain("शन्नो");
  });
});

describe("groupTtaPrasnas", () => {
  it("drops 0.0 / A.0 as leaves and groups praśna 3 from 2-part ids", () => {
    const prasnas = groupTtaPrasnas(
      parseDumpRecords(SAMPLE, { parts: 3, twoPartPrasna: 3 }),
      "https://sa.wikisource.org/wiki/x",
    );
    expect(prasnas.map((p) => p.prasna)).toEqual(["01", "02", "03", "04", "05"]);

    const p3 = prasnas.find((p) => p.prasna === "03")!;
    expect(p3.header).toContain("चित्ति");
    const a12 = p3.anuvakas.find((a) => a.anuvaka === "12")!;
    expect(a12.mantras).toHaveLength(1);
    expect(a12.mantras[0]!.samhita_devanagari).toContain("पुरु");
    expect(a12.header).toContain("पूरु");
  });
});
