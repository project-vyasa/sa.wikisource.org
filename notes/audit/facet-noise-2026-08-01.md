# Facet noise audit — Rig Veda vyview

**Date:** 2026-08-01  
**Package:** `dist/rigveda/rigveda.vyview`  
**VMLT snapshot:** `reference-snapshot-001` / `2026-07-29`  
**Pipeline:** extract → transform → enrich → build (ETEB)

## Corpus coverage

| Metric | Value |
|--------|-------|
| Riks (catalog_tree) | 10,546 |
| Riks with graph DEVATA edge | 9,699 (92.0%) |
| Riks missing DEVATA edge | 847 (8.0%) |
| Graph edges per facet type (DEVATA/RISHI/CHANDAS) | 9,699 each |
| Vocabulary entity rows | 752 |
| block_attributes distinct devatā (uniform denorm) | 83 |
| Graph devatā unique keys | 343 |
| Graph ṛṣi unique keys | 370 |
| Graph chandas unique keys | 32 |

Compared to pre-enrich Wikisource HTML: garbage chandas (verse numbers as meter names) eliminated. Remaining noise is mostly VMLT prose shape and enrich parser gaps.

## devatā (343 unique keys, 9,699 rik-edges)

| Bucket | Rik-edges | % |
|--------|-----------|---|
| clean | 9,257 | 95.4% |
| indexed_prose_slug | 224 | 2.3% |
| multi_entity_compound | 137 | 1.4% |
| long_compound | 46 | 0.5% |
| english_garbage | 35 | 0.4% |

Top values:

| Key | Riks |
|-----|------|
| `indra` | 2,551 |
| `agni` | 1,663 |
| `soma_pavamana` | 1,026 |
| `visvedevas` | 638 |
| `asvins` | 617 |
| `maruts` | 401 |
| `usas` | 181 |
| `mitra_varuna` | 154 |
| `agni_indra` | 111 |
| `agni_vaisvanara` | 94 |
| `rbhus` | 92 |
| `varuna` | 91 |

## ṛṣi (370 unique keys, 9,699 rik-edges)

| Bucket | Rik-edges | % |
|--------|-----------|---|
| clean | 8,731 | 90.0% |
| ambiguous_or | 610 | 6.3% |
| long_multi_rishi | 189 | 1.9% |
| indexed_prose_slug | 103 | 1.1% |
| multi_compound | 66 | 0.7% |

Top values:

| Key | Riks |
|-----|------|
| `vasistha_maitravaruni` | 710 |
| `bharadvaja_barhaspatya` | 505 |
| `vamadeva_gautama` | 491 |
| `visvamitra_gathina` | 406 |
| `grtsamada_bhargava_saunaka` | 313 |
| `medhatithi_kanva` | 240 |
| `dirghatamas_aucathya` | 235 |
| `agastya_maitravaruni` | 231 |
| `gotama_rahugana` | 198 |
| `kutsa_angirasa` | 192 |
| `syavasva_atreya` | 172 |
| `asita_kasyapa_or_devala_kasyapa` | 164 |

## chandas (32 unique keys, 9,699 rik-edges)

| Bucket | Rik-edges | % |
|--------|-----------|---|
| canonical | 9,545 | 98.4% |
| parser_artifact_ng_split | 123 | 1.3% |
| obscure_meter | 26 | 0.3% |
| parse_fallback | 4 | 0.0% |
| other | 1 | 0.0% |

Top values:

| Key | Riks |
|-----|------|
| `trishtubh` | 3,913 |
| `gayatri` | 2,264 |
| `jagati` | 1,215 |
| `anushtubh` | 739 |
| `brihati` | 611 |
| `usnih` | 279 |
| `viraj` | 170 |
| `pankti` | 140 |
| `kti` | 123 |
| `ashti` | 84 |
| `kakubh` | 62 |
| `uparistajjyotis` | 23 |

## Devatā — indexed prose slugs (sample)

VMLT `info.to` uses per-rik ranges (`1: prajāpati; 3-5: savitṛ`) that `parseIndexedProse` does not always split; entire prose becomes one entity key.

- `1_5_9_11_17_19_brahmanaspati_2_4_6_8_10_12_16_18_brhaspati` — 19 riks

## Ṛṣi — ambiguous `or` alternates (sample)

- `asita_kasyapa_or_devala_kasyapa…` — 164 riks
- `vimada_aindra_or_vimada_prajapatya_or_vimada_aindra_and_vasukrt_vasukr…` — 66 riks
- `prajapati_vacya_or_prajapati_vaisvamitra…` — 52 riks
- `srutakaksa_angirasa_or_sukaksa_angirasa…` — 33 riks
- `somahuti_bhargava_saunaka_or_kurma_gartsamada…` — 31 riks
- `bhrgu_varuni_or_jamadagni_bhargava…` — 30 riks
- `bandhu_gaupayana_srutabandhu_gaupayana_subandhu_gaupayana_viprabandhu_…` — 28 riks
- `visvamanas_vaiyasva_or_vyasva_angirasa…` — 25 riks
- `prayoga_bhargava_or_agni_pavaka_barhaspatya_or_agni_grhapati_sahasah_s…` — 22 riks
- `kusika_aisirathi_or_visvamitra_gathina…` — 22 riks
- `matsya_sammada_or_manya_maitravaruni…` — 21 riks
- `murdhanvat_angirasa_or_murdhanvat_vamadevya…` — 19 riks
- `bharadvaja_barhaspatya_or_vitahavya_angirasa…` — 19 riks
- `gopavana_atreya_or_saptavadhri_atreya…` — 18 riks
- `kavasa_ailusa_or_aksa_maujavat…` — 14 riks
- `baru_angirasa_or_sarvahari_aindra…` — 13 riks
- `bindu_angirasa_or_putadaksa_angirasa…` — 12 riks
- `1_3_8_10_12_kumara_atreya_or_vrsa_jana_or_both_together_2_9_vrsa_jana…` — 12 riks
- `durmitra_kautsa_or_sumitra_kautsa…` — 11 riks
- `divya_angirasa_or_daksina_prajapatya…` — 11 riks
- `visvamitra_gathina_or_prajapati_vaisvamitra_or_prajapati_vacya…` — 10 riks
- `sadhri_vairupa_or_gharma_tapasa…` — 10 riks
- `kasyapa_marica_or_manu_vaivasvata…` — 10 riks

## Chandas — non-canonical keys

| Key | Riks | Notes |
|-----|------|-------|
| `kti` | 123 | **Parser bug** — see § What is `kti`? |
| `uparistajjyotis` | 23 | VMLT obscure style name |
| `pratistha` | 3 | VMLT / transliteration |
| `kti_or_usnih` | 3 | VMLT alternates; map to primary meter |
| `tanusira` | 1 |  |
| `kti_according_to_syllable_count` | 1 | VMLT prose fallback |

## What is `kti`?

**Not** the Vedic meter **Kṛti** (कृति, 20 syllables per pāda in classical lists).

`kti` (123 riks) is a **parser artifact** in `parseMeterRanges` (`src/lib/vmlt-ranges.ts`). The meter-name regex character class includes `ṇ` (U+1E47) but not **`ṅ` (U+1E45)**, which appears throughout VMLT paṅkti compounds (`prastārapaṅkti`, `nicṛtpaṅkti`, `padapaṅkti`, …).

Example — sukta **10.18** rik 11, VMLT 2nd set: `prastārapaṅkti (11)`.

The regex splits at `ṅ`, leaving a false match `kti (11)` → entity key `kti`.

**Fix (FR-4):** add `ṅ` (and audit other IAST letters) to `METER_CHUNK_RE`; map `*paṅkti*` variants to canonical `pankti` or retain subtype keys intentionally.

## Explorer noise (viewer)

Even with clean graph keys, the sidebar can look noisy when:

1. Vocabulary labels transliterate failed prose keys into long Devanagari strings.
2. Uniform suktas expose both graph entity keys and `block_attributes` Devanagari until deduped.
3. `vocabulary/facets.vy` not yet packed for type labels.

## Recommended publisher follow-ups

1. Fix `ṅ` in meter regex (eliminates most `kti`).
2. Harden `parseIndexedProse` for comma/Devanagari-indexed VMLT ranges.
3. Policy for `or` alternates (pick primary ṛṣi vs multi-valued facet).
4. Add `vocabulary/facets.vy`.
5. After FR-2 (graph weave): drop uniform `sukta.rishi/devata/chandas` denorm; deprecate manifest `facet_attributes` (FR-5).

## Related

- [enrich-rv.md](../enrich-rv.md)
- [feature-requests-followup.md](../feature-requests-followup.md)
