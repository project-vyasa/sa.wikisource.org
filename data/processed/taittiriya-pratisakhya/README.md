# Taittirīya-Prātiśākhya — Vyasa Workspace (`taittiriya-pratisakhya`)

Single-stream sūtra workspace generated from [तैत्तरीयप्रातिशाख्यम्](https://sa.wikisource.org/wiki/तैत्तरीयप्रातिशाख्यम्) on Sanskrit Wikisource (Wikisource spelling uses one त in तैत्तरीय).

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `sutra` (spine; `[streams.primary]`) | `content/sutra/` | Mūla Devanagari. Packed name is the folder (`sutra`). |

Hierarchy: **adhyāya → sūtra** (24 adhyāyas). Corpus id: `taittiriya-pratisakhya`. CLI suffix: `:ttpr`. Dump sūtra numbers are noisy; extract assigns sequential leaf ids in source order.

This is Vedāṅga recitation grammar, not a chapter of TTS/TTA. Do not splice it into the saṃhitā stream.

Content is produced locally (`transform:ttpr`) and gitignored. Configs and templates are committed.

See [`notes/taittiriya.md`](../../../notes/taittiriya.md).
