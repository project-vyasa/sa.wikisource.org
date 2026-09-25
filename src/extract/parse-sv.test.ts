import { describe, expect, it } from "bun:test";
import { groupSamavedaSegments, parseSamavedaDump } from "./parse-sv";

const SAMPLE = `
पूर्वार्चिकः/छन्द आर्चिकः/1.1.1 प्रथमप्रपाठकः/1.1.1.1 प्रथमा दशतिः

अग्ने आ याहि वीतये गृणानो हव्यदातये। नि होता सत्सि बर्हिषि ।। 1 ।।
नमस्ते अग्न ओजसे गृणन्ति देव कृष्टयः। अमैरमित्रमर्दय ।।11
त्वमग्ने यज्ञानां होता विश्वेषा हितः। देवेभिर्मानुषे जने ।। 2 ।।

पूर्वार्चिकः/छन्द आर्चिकः/1.1.2 द्वितीयप्रपाठकः/1.1.2.3 तृतीया दशतिः

यज्ञाय यज्ञमयजन्त देवाः ।। 1 ।।

2.1.1 (651 - 712)
उत्तरार्चिकः/प्रथमप्रपाठकः/प्रथमोऽर्द्धः
[धा. 16 । उ ना. । स्व. 3 ।]
उपास्मै गायत नर ।। 1 ।।
कया नश्चित्र आ भुवम् ।। 2 ।।
`;

describe("parseSamavedaDump", () => {
  it("parses pūrvārcika daśati headers and ॥ n ॥ mantras", () => {
    const recs = parseSamavedaDump(SAMPLE);
    const first = recs.find(
      (r) => r.arcika === 1 && r.prapāṭhaka === 1 && r.segment === 1 && r.mantra === 1,
    );
    expect(first?.body).toContain("अग्ने");
    expect(first?.segmentKind).toBe("dasati");
    const tail = recs.find((r) => r.mantra === 11);
    expect(tail?.body).toContain("नमस्ते");

    const secondDasati = recs.find(
      (r) => r.arcika === 1 && r.prapāṭhaka === 2 && r.segment === 3 && r.mantra === 1,
    );
    expect(secondDasati?.body).toContain("यज्ञ");
  });

  it("parses uttarārcika ardha ranges and skips stobha cues", () => {
    const recs = parseSamavedaDump(SAMPLE);
    const uttara = recs.filter((r) => r.arcika === 2 && r.prapāṭhaka === 1 && r.segment === 1);
    expect(uttara).toHaveLength(2);
    expect(uttara[0]!.segmentKind).toBe("ardha");
    expect(uttara.some((r) => r.body.includes("उपास्मै"))).toBe(true);
  });
});

describe("groupSamavedaSegments", () => {
  it("groups records into extract JSON segments", () => {
    const segments = groupSamavedaSegments(
      parseSamavedaDump(SAMPLE),
      "https://sa.wikisource.org/wiki/x",
    );
    expect(segments).toHaveLength(3);
    expect(segments[0]!.arcika).toBe("01");
    expect(segments[0]!.mantras).toHaveLength(3);
    expect(segments[2]!.segment_kind).toBe("ardha");
  });
});
