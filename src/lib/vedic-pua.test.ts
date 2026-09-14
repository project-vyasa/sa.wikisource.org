import { describe, expect, it } from "bun:test";
import {
  cleanVedicDumpText,
  isLatinGarbage,
  mapVedicPua,
  stripTrailingKhandaNumber,
} from "./vedic-pua";

describe("mapVedicPua", () => {
  it("maps dump anusvara and visarga onto real Devanagari", () => {
    expect(mapVedicPua("त्रिच\uE001शत्")).toBe("त्रिचंशत्");
    expect(mapVedicPua("स्वती\uF131 पय")).toBe("स्वतीः पय");
    expect(mapVedicPua("स्ता\uF176द्दे")).toBe("स्ता॑द्दे");
  });
});

describe("stripTrailingKhandaNumber", () => {
  it("drops the running [N] khaṇḍa counter", () => {
    expect(stripTrailingKhandaNumber("कर्मणे ॥ [1]")).toBe("कर्मणे ॥");
    expect(stripTrailingKhandaNumber("बर्हिः [2]")).toBe("बर्हिः");
  });
});

describe("cleanVedicDumpText", () => {
  it("maps PUA, strips [N], and drops leftover private-use marks", () => {
    const raw = "इषे त्वा\uF131 ॥ [1]\uF184";
    expect(cleanVedicDumpText(raw)).toBe("इषे त्वाः ॥");
    expect(cleanVedicDumpText(raw)).not.toMatch(/[\uE000-\uF8FF]/u);
    expect(cleanVedicDumpText("बन्धुः ॥ [54]\n \n[[वर्गः:कृष्णयजुर्वेदः]]")).toBe(
      "बन्धुः ॥",
    );
  });
});

describe("isLatinGarbage", () => {
  it("flags English editor placeholders, not mantra text", () => {
    expect(isLatinGarbage("Write a description about anuvaka")).toBe(true);
    expect(isLatinGarbage("इ॒षे त्वो॒र्जे त्वा॑")).toBe(false);
  });
});
