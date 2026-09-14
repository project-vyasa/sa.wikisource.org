# Taittirīya Saṃhitā — Vyasa Workspace (`taittiriya-samhita`)

Single-stream workspace generated from [Sanskrit Wikisource](https://sa.wikisource.org) accented dumps.

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `samhita` (spine; `[streams.primary]`) | `content/samhita/` | Accented Devanagari. Packed name is the folder (`samhita`). `ref="primary"` in templates is the alias. |

No padapāṭha or Sāyaṇa on these Wikisource pages. Hierarchy: **kāṇḍa → praśna → anuvāka → mantra** (dump’s 4th index is the khaṇḍa; command name is `mantra` so it does not collide with kāṇḍa). Corpus id: `taittiriya-samhita`. CLI suffix: `:tts`.

Śrī Rudram (4.5) and Camakam (4.7) are **featured spans** in `annotations/featured.vy`, not separate publications.

Content is produced locally (`transform:tts`) and gitignored. Configs and templates are committed.

See [`notes/taittiriya.md`](../../../notes/taittiriya.md).
