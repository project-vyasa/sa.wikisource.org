import { describe, expect, it } from "bun:test";
import { parseSuktaHtml } from "./parse-sukta";
import { DANDA, DOUBLE_DANDA } from "../lib/danda";

describe("parseSuktaHtml danda normalization", () => {
  it("collapses typed ।। in Sayana intro to ॥", () => {
    const html = `<div class="mw-parser-output">
<p>सायणभाष्यम्</p>
<p>ऐन्द्र्यः${DANDA}${DANDA} आदह इति सूत्रितम् ${DANDA}${DANDA}</p>
<p>अ॒ग्निमी॑ळे पुरोहितम् ${DOUBLE_DANDA}१</p>
</div>`;
    const sukta = parseSuktaHtml({
      html,
      sourceFile: "fixture.html",
      sourceUrl: "https://example.test/1.6",
      mandala: 1,
      sukta: 6,
    });
    expect(sukta.anukramani.introduction).toBe(
      `ऐन्द्र्यः${DOUBLE_DANDA} आदह इति सूत्रितम् ${DOUBLE_DANDA}`,
    );
    expect(sukta.anukramani.introduction?.includes(DANDA + DANDA)).toBe(false);
  });
});
