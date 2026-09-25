import { describe, expect, it } from "bun:test";
import { parseAtharvavedaKanda, toExtractedSuktas } from "./parse-av";

const SAMPLE = `
*[[/सूक्तम् ०१|सूक्तम् १]]
<poem><span style="font-size: 14pt;">1,1
ये त्रिषप्ताः परियन्ति विश्वा रूपाणि बिभ्रतः ।
वाचस्पतिर्बला तेषां तन्वो अद्य दधातु मे ॥१॥
पुनरेहि वचस्पते देवेन मनसा सह ।
वसोष्पते नि रमय मय्येवास्तु मयि श्रुतम् ॥२॥

1.2
विद्मा शरस्य पितरं पर्जन्यं भूरिधायसम् ।
विद्मो ष्वस्य मातरं पृथिवीं भूरिवर्पसम् ॥१॥
`;

describe("parseAtharvavedaKanda", () => {
  it("parses 1,1 in poem wrapper and multi-line ॥n॥ ṛks", () => {
    const suktas = parseAtharvavedaKanda(SAMPLE, 1);
    expect(suktas).toHaveLength(2);
    expect(suktas[0]!.sukta).toBe(1);
    expect(suktas[0]!.riks).toHaveLength(2);
    expect(suktas[0]!.riks[0]!.body).toContain("वाचस्पति");
    expect(suktas[1]!.sukta).toBe(2);
    expect(suktas[1]!.riks[0]!.body).toContain("पृथिवी");
  });

  it("emits padded extract JSON", () => {
    const out = toExtractedSuktas(
      parseAtharvavedaKanda(SAMPLE, 1),
      "https://sa.wikisource.org/wiki/x",
      "kanda-01.wikitext.json",
    );
    expect(out[0]!.kanda).toBe("01");
    expect(out[0]!.sukta).toBe("001");
    expect(out[0]!.riks[0]!.rik).toBe("01");
  });
});
