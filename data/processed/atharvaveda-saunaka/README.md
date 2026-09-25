# Atharvaveda Śaunaka — Vyasa Workspace (`atharvaveda-saunaka`)

Single-stream workspace generated from [Sanskrit Wikisource](https://sa.wikisource.org) consolidated kāṇḍa pages.

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `samhita` (spine; `primary = true`) | `content/samhita/` | Unaccented Devanagari saṃhitā. Packed name is the folder (`samhita`). |

Hierarchy: **kāṇḍa → sūkta → ṛk** (RV-shaped). CLI suffix: `:av`.

No padapāṭha or Sāyaṇa on these Wikisource pages for v1. `.vy` content is produced locally (`transform:av`) and gitignored; `vyasac.toml` and `content/samhita/stream.toml` are committed.

See [`notes/atharvaveda.md`](../../../notes/atharvaveda.md).
