# Verification (Stage 5)

Stage 5 audits extracted data before `vyasac pack` / `publish`. A trimmed summary is committed under `data/audit/` (extracted JSON and workspace content remain gitignored).

## Commands

```bash
bun run verify:rv
```

## Report contents (`data/audit/rigveda-segments-latest.txt`)

### Segment summary (committed)

| Metric | Meaning |
| :--- | :--- |
| **p100** | Maximum segments on any single rik (leaf-block). |
| **segment_bit_width** | `ceil(log2(p100 + 1))` — planning hint for graph-node ID packing. |
| **riks above compiler limit** | Count with **> 15** segments (vyasac 4-bit sub-segment field; RFC-019). |

Per-rik listings for high segment counts are **not** written to the committed report (padapatha token granularity inflates counts; summary is enough for manifest planning).

### Missing layers (committed — full lists)

Complete lists of riks missing:

- **padapatha** (`padapatha_devanagari` absent in extract)
- **sayanacharya bhashya** (`sayanacharya_bhashya` absent in extract)

These are useful for source-gap triage and patch follow-up.

### Planned audits

- Rik count consistency across streams
- Stripped-accent vs Wikisource unaccented (sandhi QA)
- Syllable / meter checks (chandas from anukramani)
- Anukramani triangulation vs reference index — see [anukramani-audit.md](./anukramani-audit.md)

Implementation: [`src/verify/index.ts`](../src/verify/index.ts).
