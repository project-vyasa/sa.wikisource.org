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
content/<stream>/<mandala>/<sukta>.vy     # text (transform:rv)
annotations/anukramani/<mandala>.vy       # VMLT anukramani graph (enrich:rv)
vocabulary/entities.vy                    # ṛṣi / devatā keys (enrich:rv)
vocabulary/meters.vy                      # chandas keys (enrich:rv)
```

Example URN relative path: `01:001:01` (mandala 1, sukta 1, rik 1).

Content and generated annotations are produced locally (`transform:rv`, `enrich:rv`) and are gitignored.
Configs, templates, and this README are committed.

See `notes/enrich-rv.md` for the enrichment stage.
