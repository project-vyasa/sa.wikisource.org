import { describe, expect, it } from "bun:test";
import { patchVyContext } from "./apply-display-context";

const SAMPLE = `\`set context {
  mandala = "01",
  sukta = "001",
  mandala.title = "Mandala 1",
  sukta.title = "Sukta 1:1"
}

\`v 1 [
text
]
`;

describe("patchVyContext", () => {
  it("writes uniform anukramani labels into sukta.*", () => {
    const next = patchVyContext(SAMPLE, {
      rishi: "मधुच्छन्दाः",
      devata: "अग्निः",
      chandas: "गायत्री",
    });
    expect(next).toContain('sukta.rishi = "मधुच्छन्दाः"');
    expect(next).toContain('sukta.devata = "अग्निः"');
    expect(next).toContain('sukta.chandas = "गायत्री"');
  });

  it("strips anukramani keys for mixed suktas", () => {
    const withMeta = patchVyContext(SAMPLE, {
      rishi: "मधुच्छन्दाः",
      devata: "अग्निः",
      chandas: "गायत्री",
    });
    const stripped = patchVyContext(withMeta, { stripOnly: true });
    expect(stripped).not.toContain("sukta.rishi");
    expect(stripped).not.toContain("sukta.devata");
    expect(stripped).not.toContain("sukta.chandas");
    expect(stripped).toContain('sukta.title = "Sukta 1:1"');
  });
});
