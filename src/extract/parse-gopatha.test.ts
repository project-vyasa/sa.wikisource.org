import { describe, expect, test } from "bun:test";
import { parseGopathaDump } from "./parse-gopatha";

describe("parseGopathaDump", () => {
  test("parses comma-style markers", () => {
    const segs = parseGopathaDump(
      "(१,१.१अ) ओं ब्रह्म ह वा इदं\n(१,१.१ब्) तदैक्षत\n(२,१.१अ) अथ यद्ब्रह्म",
    );
    expect(segs.length).toBe(3);
    expect(segs[0]).toMatchObject({ kanda: 1, prapathaka: 1, kandika: 1, pada: "अ" });
    expect(segs[0]!.body).toContain("ब्रह्म");
    expect(segs[2]!.kanda).toBe(2);
  });
});
