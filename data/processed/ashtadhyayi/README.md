# Aṣṭādhyāyī — Vyasa Workspace (`ashtadhyayi`)

Multi-stream workspace generated from [Sanskrit Wikisource](https://sa.wikisource.org).

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `sutra` (spine; `primary = true`) | `content/sutra/` | Mūla Devanagari from अष्टाध्यायी. Packed name is the folder (`sutra`). `ref="primary"` in templates is the alias. |
| `vyakhya` | `content/vyakhya/` | Hindi vyākhyā |
| `udaharana` | `content/udaharana/` | Examples after `\|` when present |

Maheśvara / Śiva sūtras are packed as adhyāya `09` pāda `01` (14 pratyāhāra sūtras from the mūla page). Index `00` is reserved by the packer as a slot, so they are not stored as adhyāya 0.

Hierarchy: **adhyāya → pāda → sūtra**. Corpus id: `ashtadhyayi` (see `data/wikisource-works.toml`). CLI scripts use the short suffix `:aady`.

`.vy` content is produced locally (`transform:aady`) and gitignored. `vyasac.toml`, `content/**/stream.toml`, and templates are committed.
