# Kauthuma Sāmaveda — Vyasa Workspace (`kauthuma-samhita`)

Single-stream workspace generated from [Sanskrit Wikisource](https://sa.wikisource.org) accented dump.

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `samhita` (spine; `primary = true`) | `content/samhita/` | Accented Devanagari (Devanagari Extended svara marks). Packed name is the folder (`samhita`). |

Hierarchy: **arcika → prapāṭhaka → segment (daśati / ardha) → mantra**. CLI suffix: `:sv`.

`.vy` content is produced locally (`transform:sv`) and gitignored. `vyasac.toml`, `content/samhita/stream.toml`, and templates are committed.

See [`notes/kauthuma.md`](../../../notes/kauthuma.md).
