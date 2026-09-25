# Taittirīya Āraṇyaka — Vyasa Workspace (`taittiriya-aranyaka`)

Single-stream workspace generated from the [Sanskrit Wikisource](https://sa.wikisource.org) accented dump [तैत्तिरीय-आरण्यकम्](https://sa.wikisource.org/wiki/तैत्तिरीय-आरण्यकम्).

## Streams

| Stream | Path | Content |
|--------|------|---------|
| `samhita` (spine; `primary = true`) | `content/samhita/` | Accented Devanagari. Packed name is the folder (`samhita`). |

Hierarchy: **praśna → anuvāka → mantra** (no kāṇḍa). Corpus id: `taittiriya-aranyaka`. CLI suffix: `:tta`.

## What this edition is (for readers)

This Wikisource dump is an **8-praśna** recension. Printed Ānandāśrama-style books often have **10 prapāṭhakas** and number the famous Upaniṣad chapters differently. **Use the “here” column below**, not a printed-edition citation, when opening this publication.

| Popular name | In this publication | In many printed TA editions |
| :--- | :--- | :--- |
| Puruṣa sūkta | **Praśna 3, anuvāka 12** | TA 3.12 (same) |
| Śikṣāvallī (Taittirīya Upaniṣad 1) | **Praśna 5** | TA 7 |
| Mahānārāyaṇa Upaniṣad | **Praśna 6** | TA 10 |
| Brahmānandavallī (TU 2) | **not in this source** | TA 8 |
| Bhṛguvallī (TU 3) | **not in this source** | TA 9 |

Named spans (`sikshavalli`, `mahanarayana`, `purusha_sukta`) are annotations in the parent package, not separate catalog works. There is no catalog id `taittiriya-upanishad`.

**Not in this source:** Brahmānanda and Bhṛgu vallīs. Do not treat missing praśnas 9–10 as a packing bug — the accented dump stops at praśna 8.

## Extract note (contributors)

Praśnas 1–2 and 4–8 use 3-part dump ids `P.A.M`. Praśna 3 is dumped as 2-part `A.M` between 2.19 and 4.0.0; extract promotes those ids to praśna 3 so the URN is `3:anuvaka:mantra`.

Content is produced locally (`transform:tta`) and gitignored. Configs and templates are committed.

See [`notes/taittiriya.md`](../../../notes/taittiriya.md).
