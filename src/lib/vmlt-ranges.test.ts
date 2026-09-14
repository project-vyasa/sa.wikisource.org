import { describe, expect, it } from "bun:test";
import {
  buildPerRikRoman,
  expandRikRangeTokens,
  normalizeRikDigits,
  parseIndexedProse,
  parseMeterRanges,
} from "./vmlt-ranges";
import { chandasKeyFromMeterProse } from "./chandas-keys";

describe("normalizeRikDigits", () => {
  it("converts Devanagari digits", () => {
    expect(normalizeRikDigits("१, २")).toBe("1, 2");
  });
});

describe("expandRikRangeTokens", () => {
  it("expands comma-separated indices", () => {
    expect(expandRikRangeTokens("1, 2, 4")).toEqual([1, 2, 4]);
  });

  it("expands Devanagari comma lists", () => {
    expect(expandRikRangeTokens("1, २")).toEqual([1, 2]);
  });
});

describe("parseIndexedProse", () => {
  it("parses comma-index VMLT segments", () => {
    const map = parseIndexedProse("1, २: agastya; ३, ५: lopamudra", 6);
    expect(map.get(1)).toBe("agastya");
    expect(map.get(2)).toBe("agastya");
    expect(map.get(3)).toBe("lopamudra");
    expect(map.get(5)).toBe("lopamudra");
  });

  it("still parses scalar prose", () => {
    const map = parseIndexedProse("agni", 3);
    expect(map.get(1)).toBe("agni");
    expect(map.get(3)).toBe("agni");
  });

  it("parses range-then-comma lists (1-3, 6, 7: indra)", () => {
    const map = parseIndexedProse("1-3, 6, 7: indra; 4, 5: aśvins", 7);
    expect(map.get(1)).toBe("indra");
    expect(map.get(4)).toBe("aśvins");
    expect(map.get(7)).toBe("indra");
  });
});

describe("parseMeterRanges", () => {
  const meters10_18 =
    "1st set of styles: nicṛttriṣṭup (1, 5, 7-9, 14); triṣṭup (2-4, 6, 12, 13); bhuriktriṣṭup (10); nicṛtpaṅkti (11) 2nd set of styles: triṣṭubh (1-10, 12); prastārapaṅkti (11); jagatī (13); anuṣṭubh (14)";

  it("parses paṅkti compounds with ṅ (not false kti split)", () => {
    const map = parseMeterRanges(meters10_18, 14);
    expect(map.get(11)).toBe("prastārapaṅkti");
    expect(map.get(10)).toBe("triṣṭubh");
    expect(map.get(13)).toBe("jagatī");
  });

  it("maps prastārapaṅkti to canonical pankti", () => {
    const mapped = chandasKeyFromMeterProse("prastārapaṅkti");
    expect(mapped?.key).toBe("pankti");
  });
});
