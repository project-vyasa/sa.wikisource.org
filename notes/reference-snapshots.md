# Reference snapshots (private)

Publisher repos may triangulate extracted metadata against **private point-in-time snapshots** stored in a separate repository (e.g. `reference-snapshot-001`). See that repo's README for layout and fetch tooling.

## Contract

| Layer | Location | Public? |
|-------|----------|---------|
| Raw third-party JSON | Private `reference-snapshot-001/snapshots/.../data/` | No |
| Triangulation audit | `data/audit/` in this repo | Summary only |
| Metadata enrichments | Stage 4 `enrich:rv` → `annotations/anukramani/` (graph) | Generated locally |

## Usage (local)

```bash
export REFERENCE_SNAPSHOTS=/path/to/reference-snapshot-001
# Triangulation scripts (when implemented) read:
#   $REFERENCE_SNAPSHOTS/snapshots/{source_id}/{corpus_id}/{date}/data/{mm}/{mm}-{sss}.json
```

Pin a snapshot date for reproducible diffs. Do not commit third-party JSON into this repository.

Related: [anukramani-audit.md](./anukramani-audit.md), [enrich-rv.md](./enrich-rv.md), [architecture-and-sharing.md](./architecture-and-sharing.md).
