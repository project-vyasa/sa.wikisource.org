# Rig Veda — Vyasa Workspace

Multi-stream workspace generated from [Sanskrit Wikisource](https://sa.wikisource.org).

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `primary` (samhita) | `content/samhita/` | Accented Devanagari Samhita |
| `padapatha` | `content/padapatha/` | Word-by-word Padapatha |
| `sayana` | `content/sayana/` | Sayanacharya Bhashya |

Hierarchy: **mandala → sukta → rik**.

## Layout

```text
content/<stream>/<mandala>/<sukta>.vy
```

Example URN relative path: `01:001:01` (mandala 1, sukta 1, rik 1).

Content files are produced by `bun run transform:rv` and are gitignored.
Configs, templates, and this README are committed.
