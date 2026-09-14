import { describe, expect, it } from "bun:test";
import {
  DANDA,
  DOUBLE_DANDA,
  collapseFalseDoubleDanda,
} from "./danda";

describe("collapseFalseDoubleDanda", () => {
  it("turns two single dandas into one double danda", () => {
    expect(collapseFalseDoubleDanda(`ऐन्द्र्यः${DANDA}${DANDA} आदह`)).toBe(
      `ऐन्द्र्यः${DOUBLE_DANDA} आदह`,
    );
  });

  it("keeps a true double danda", () => {
    expect(collapseFalseDoubleDanda(`इति सूत्रितम् ${DOUBLE_DANDA}`)).toBe(
      `इति सूत्रितम् ${DOUBLE_DANDA}`,
    );
  });

  it("leaves a single danda alone", () => {
    expect(collapseFalseDoubleDanda(`पूर्ववत्${DANDA} दशर्चे`)).toBe(
      `पूर्ववत्${DANDA} दशर्चे`,
    );
  });

  it("does not join dandas separated by a space", () => {
    expect(collapseFalseDoubleDanda(`अ${DANDA} ${DANDA}ब`)).toBe(
      `अ${DANDA} ${DANDA}ब`,
    );
  });
});
