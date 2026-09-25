import { describe, expect, test } from "bun:test";
import { parseBrahmanaProseAdhyaya } from "./parse-brahmana-prose";

const SAMPLE = `
[[/अध्यायः ०१|अध्यायः १]]
१.१
अग्निर्ह वै देवानामवमो विष्णुः पूर्वः।
१.२
द्वितीयं खण्डम् इत्थम्।
`.trim();

describe("parseBrahmanaProseAdhyaya", () => {
  test("splits devanagari section headers", () => {
    const sections = parseBrahmanaProseAdhyaya(SAMPLE);
    expect(sections.length).toBe(2);
    expect(sections[0]).toMatchObject({ adhyaya: 1, section: 1 });
    expect(sections[0]!.body).toContain("अग्निर्ह");
    expect(sections[1]!.body).toContain("द्वितीयं");
  });

  test("accepts arabic digit headers (Pañcaviṃśa style)", () => {
    const sections = parseBrahmanaProseAdhyaya("1.1\nप्रथमः पाठः\n1.2\nद्वितीयः खण्डम्");
    expect(sections.length).toBe(2);
    expect(sections[0]).toMatchObject({ adhyaya: 1, section: 1 });
    expect(sections[0]!.body).toContain("प्रथमः");
  });

  test("treats long same-line tail as body", () => {
    const prose = "अ".repeat(80);
    const sections = parseBrahmanaProseAdhyaya(`1.1\t${prose}`);
    expect(sections.length).toBe(1);
    expect(sections[0]!.title).toBeNull();
    expect(sections[0]!.body).toContain(prose.slice(0, 20));
  });
});
