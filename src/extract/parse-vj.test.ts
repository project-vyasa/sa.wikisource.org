import { describe, expect, test } from "bun:test";
import { parseVersesFromSectionBody, parseVedangaJyotisha } from "./parse-vj";

describe("parseVersesFromSectionBody", () => {
  test("joins lines before a single verse marker", () => {
    const verses = parseVersesFromSectionBody(
      "पञ्चसम्वत्सरमयम्युगाध्यक्षम्प्रजापतिम्।\nदिनर्त्वयनमासाङ्गम्प्रणम्यशिरसाशुचिः॥१॥\nप्रणम्यशिरसाकालमभिवाद्यसरस्वतीम्॥२॥",
    );
    expect(verses.length).toBe(2);
    expect(verses[0]!.verse).toBe(1);
    expect(verses[0]!.body).toContain("पञ्चसम्वत्सर");
    expect(verses[0]!.body).toContain("दिनर्त्वयन");
    expect(verses[1]!.verse).toBe(2);
  });

  test("merges duplicate verse numbers on WS typos", () => {
    const verses = parseVersesFromSectionBody("अ॥४२॥ ब॥४२॥");
    expect(verses.length).toBe(1);
    expect(verses[0]!.body).toContain("अ");
    expect(verses[0]!.body).toContain("ब");
  });
});

describe("parseVedangaJyotisha", () => {
  test("splits wiki sections", () => {
    const wt = "== आर्चज्योतिषम् ==\nअ॥१॥\n== याजुषज्योतिषम् ==\nब॥१॥";
    const ch = parseVedangaJyotisha(wt);
    expect(ch.map((c) => c.chapter)).toEqual(["archa", "yajusha"]);
  });
});
