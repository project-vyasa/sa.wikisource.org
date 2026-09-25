# Kauthuma Sāmaveda — Vyasa Workspace (`kauthuma-samhita`)

Single-stream workspace generated from [Sanskrit Wikisource](https://sa.wikisource.org) accented dump.

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `samhita` (spine; `[streams.primary]`) | `content/samhita/` | Accented Devanagari (Devanagari Extended svara marks). Packed name is the folder (`samhita`). |

Hierarchy: **arcika → prapāṭhaka → segment (daśati / ardha) → mantra**. CLI suffix: `:sv`.

Content is produced locally (`transform:sv`) and gitignored. Configs and templates are committed.

See [`notes/kauthuma.md`](../../../notes/kauthuma.md).
