# Rig Veda — Vyasa Workspace

Multi-stream workspace generated from [Sanskrit Wikisource](https://sa.wikisource.org).

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `samhita` (spine; `[streams.primary]`) | `content/samhita/` | Accented Devanagari Samhita. Packed name is the folder (`samhita`). `ref="primary"` in templates is the alias. |
| `padapatha` | `content/padapatha/` | Word-by-word Padapatha |
| `sayana` | `content/sayana/` | Sayanacharya Bhashya |

Hierarchy: **mandala → sukta → rik**.

## Layout

```text
content/<stream>/<mandala>/<sukta>.vy     # text (transform:rv)
annotations/anukramani/<mandala>.vy       # VMLT anukramani graph (enrich:rv)
vocabulary/entities.vy                    # ṛṣi / devatā keys (enrich:rv)
vocabulary/meters.vy                      # chandas keys (enrich:rv)
templates/html/                           # stream block templates (context.vy)
templates/html/views/theme.vy             # theme_layout body slot — shell + CSS from packer
templates/html/views/reading.vy           # craft stacked reading (reading.css)
```

| Path | Role |
|------|------|
| `templates/html/theme.css` | Workspace overrides (`css`) |
| `templates/html/reading.css` | Craft reading rules (`css`) |
| `sa_wikisource/styles/indic-verse.css` | Publisher-shared tokens, `html.theme-*`, grid `.vyasa-block-*` (`publisher_css`) |

Example URN relative path: `01:001:01` (mandala 1, sukta 1, rik 1).

Content and generated annotations are produced locally (`transform:rv`, `enrich:rv`) and are gitignored.
Configs, templates, and this README are committed.

See `notes/enrich-rv.md` for the enrichment stage.
