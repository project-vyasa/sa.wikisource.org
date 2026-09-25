# Taittirīya Brāhmaṇa — Vyasa Workspace (`taittiriya-brahmana`)

Single-stream workspace generated from the [Sanskrit Wikisource](https://sa.wikisource.org) accented dump [तैत्तिरीयब्राह्मणम्](https://sa.wikisource.org/wiki/तैत्तिरीयब्राह्मणम्).

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `samhita` (spine; `primary = true`) | `content/samhita/` | Accented Devanagari. Packed name is the folder (`samhita`). |

Hierarchy: **kāṇḍa → praśna → anuvāka → mantra**, same dump numbering as TTS. Corpus id: `taittiriya-brahmana`. CLI suffix: `:ttb`.

## What this edition is (for readers)

The accented dump is the source of truth. It covers:

| Kāṇḍa | Praśnas in this publication |
| :--- | :--- |
| 1 | 1–8 |
| 2 | 1–8 |
| 3 | **1–9 only** |

Some printed editions and the unaccented Wikisource visvara pages continue **kāṇḍa 3 praśnas 10–12**. Those chapters are **not in this package**. That is a source gap, not a packing error.

Content is produced locally (`transform:ttb`) and gitignored. Configs and templates are committed.

See [`notes/taittiriya.md`](../../../notes/taittiriya.md).
