# Atharvaveda Śaunaka (`atharvaveda-saunaka`)

CLI / build shorthand: **`av`** (`crawl:av`, `build:av`, …).  
Catalog / workspace id: **`atharvaveda-saunaka`** (not `atharvaveda`, not `av`).

Related: [`wikisource-works.toml`](../data/wikisource-works.toml), [`rigveda.md`](./rigveda.md).

---

## 1. Recension

Wikisource material probed here is **Śaunaka** saṃhitā (20 kāṇḍas). **Paippalāda** is a different recension — allocate a separate catalog id when a spine is chosen; do not merge into this work.

---

## 2. Wikisource page trees (pick one spine)

Prefix search shows **two parallel hierarchies**:

| Tree | Example | Use for v1 |
| :--- | :--- | :--- |
| **Consolidated kāṇḍa** | [अथर्ववेदः/काण्डं १](https://sa.wikisource.org/wiki/अथर्ववेदः/काण्डं_१) | **Yes — spine** |
| `अथर्ववेदः/अथर्ववेद: काण्डं N` | Per-sūkta subpages | No — fragmented duplicate |
| ASCII `अथर्ववेदः/काण्डं 1` | Old page id | Prefer Devanagari `काण्डं १` … `२०` |

**Crawl list:** `अथर्ववेदः/काण्डं {१..२०}` — verify each title exists before bulk download (kāṇḍa २ was missing under that exact title during probe; may need `अथर्ववेद: काण्डं २` fallback — resolve in `crawl:av` with a manifest).

Other top-level pages (`gopatha01`, `ऋषिसूची`) are **not** saṃhitā spine.

---

## 3. Hierarchy in consolidated kāṇḍa pages

Probe: [अथर्ववेदः/काण्डं १](https://sa.wikisource.org/wiki/अथर्ववेदः/काण्डं_१) (2026-09-22).

| Level | Dump pattern | Example |
| :--- | :--- | :--- |
| **kāṇḍa** | Page title | `१` |
| **sūkta** | `kāṇḍa,sūkta` then `kāṇḍa.sūkta` | `1,1` then `1.2` … `1.35` |
| **ṛk** | `॥ n ॥` at line end | `॥१॥` … |

| Kāṇḍa 1 counts | Value |
| :--- | :--- |
| Sūkta nav links | **35** |
| Ṛk markers | **153** |

No accented dump found on this spine (unlike Kauthuma SV). Spine is **unaccented Devanagari** prose/verse.

### Sāyaṇa bhāṣya

The kāṇḍa page links to an external **Word** file for Sāyaṇa (`drive.google.com`), not wikitext. **Do not block v1** on commentary; saṃhitā-only stream.

---

## 4. Proposed URN

Same shape as Rig Veda, different corpus id:

```text
urn:vyasa:sa_wikisource:atharvaveda-saunaka:{kanda}:{sukta}:{rik}
```

| Field | Notes |
| :--- | :--- |
| `kanda` | `01`..`20` |
| `sukta` | Per-kāṇḍa sequence (not global AV sūkta number) |
| `rik` | `॥ n ॥` within sūkta |

On disk (RV-shaped):

```text
content/samhita/{kanda}/{sukta}.vy
```

`[streams.primary] path = "content/samhita"` — packed name `samhita`; no `stream.name = "primary"` sidecar.

**No padapāṭha / commentary streams** on these Wikisource pages for v1.

---

## 5. Parser notes

- First sūkta uses **comma** id (`1,1`); following use **dot** (`1.2`). Normalize to `(kanda, sukta)` integers in extract.
- Sūkta index pages at top (`*[[/सूक्तम् ०१|…]]`) are navigation only.
- Multi-ṛk sūktas: new `kanda.sukta` header line; ṛk counter resets at `॥१॥`.
- No Vedic tone PUA on this edition — `cleanVedicDumpText` optional / lighter than SV.

---

## 6. Out of scope for v1

| Item | Treatment |
| :--- | :--- |
| Paippalāda | Future work `atharvaveda-paippalada` (or similar) |
| Gopatha brāhmaṇa | Separate catalog row |
| Sāyaṇa (external doc) | Not ingested until wikitext or committed extract exists |
| Popular hymns as separate `.vyview` | **Spans** on parent URNs only (Kuntāpa, etc.) |

---

## 7. Pipeline sketch

```bash
bun run crawl:av       # ~20 kāṇḍa pages
bun run extract:av
bun run transform:av
bun run verify:av
bun run build:av       # data/processed/atharvaveda-saunaka
```

Closest template: **RV** crawl (many pages) + **TTS** pack layout (single `samhita` stream).

---

## 8. Open questions

1. Canonical page title for each kāṇḍa `१..२०` (Devanagari vs `अथर्ववेद: काण्डं N` duplicates).
2. Global vs per-kāṇḍa sūkta numbering in print editions — spine follows **Wikisource per-kāṇḍa** ids only.
3. Whether later kāṇḍas match kāṇḍa 1 inline format or split across subpages (spot-check kāṇḍa 10 and 20 during crawl).
