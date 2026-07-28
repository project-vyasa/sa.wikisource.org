# Extracted Rig Veda JSON Schema (Stage 2)

Locked against prototypes `1.1` (9 riks) and `1.185` (11 riks).

See also [variants-and-segments.md](./variants-and-segments.md) for retention vs derivation rules and interlinear `|` segments.

## File layout

```text
data/extracted/rigveda/<mm>/<mm>-<sss>.json
```

## Shape

```ts
{
  source_url: string;
  source_file: string;
  mandala: "01".."10";
  sukta: "001"..;
  anukramani: {
    rishi: string | null;
    devata: string | null;      // deferred
    chandas: string | null;
    introduction: string | null;
  };
  riks: [{
    rik: "01"..;
    samhita_devanagari: string;      // accented when available
    padapatha_devanagari: string | null; // accented preferred; segments + strip for unaccented
    sayanacharya_bhashya: string | null;
  }];
}
```

URN prefixes are **not** stored here. The Vyasa workspace owns the global prefix; leaf IDs are corpus-local (`mandala` / `sukta` / `` `v N ``).

**Variants:** retain accented samhita/padapatha; derive unaccented with `stripVedicAccents()` only. Sandhi-aware alignment is **not** derivable—use human-curated padapatha for QA. Interlinear gloss needs `|` segment markers at transform time (see variants doc).

**Verification:** `bun run verify:rv` reports **p100 (max) segments per rik** for graph-node ID packing — see [verification.md](./verification.md).

Zod: [`src/schema/rigveda.ts`](../src/schema/rigveda.ts).

## Commands

```bash
bun run extract:sample
bun run extract:rv
bun run verify:rv
```
