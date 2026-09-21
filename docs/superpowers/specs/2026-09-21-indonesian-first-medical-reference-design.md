# Indonesian-First Medical Reference Design

## Goal

Turn J-Med Mastery into a fast, Indonesian-first reference for an Indonesian doctor communicating with Japanese expatriate patients, while preserving the existing Medical architecture and keeping the product focused on language learning rather than clinical decision support.

## Scope of this slice

This slice delivers a coherent end-to-end foundation for the Medical module:

- a complete clinical term and phrase contract with mandatory romaji;
- Indonesian-first medical search across all existing medical and learning content;
- a phone-first J-Unit encounter flow;
- relationship-driven Related Content sections;
- configurable furigana, romaji, Indonesian, and English display preferences;
- SRS actions for terms, phrases, and grouped clinical sets;
- visible coverage and verification dashboards;
- starter clinical content focused on common symptoms, diseases, investigations, medications, and workflows;
- an RFSmed mapping layer that treats RFSmed as the target inventory and source reference without duplicating its clinical decision-support behavior;
- optional Jisho enrichment for draft discovery only.

The full RFSmed inventory is a staged content-expansion program, not a reason to replace or duplicate the existing Medical pages.

## Product principles

1. Bahasa Indonesia is the primary explanation language in Medical.
2. English is a secondary reference language and may be hidden.
3. Japanese, kana, romaji, and Indonesian are the default clinical learning sequence.
4. Professional terminology, clinician patient-facing wording, and natural patient wording are separate data, not interchangeable translations.
5. Japanese text and stable IDs are canonical; romaji is required data but never an identifier.
6. Unverified or machine-assisted Japanese is visibly labeled and cannot silently become verified.
7. RFSmed concepts are mapped into communication-learning content; dosing and clinical decision support remain links or references to RFSmed rather than duplicated logic.
8. Existing high-quality Medical pages remain the presentation foundation.

## Architecture

### Domain layer

Extend `lib/content/schema.ts` so every medical term has required kana and romaji, Indonesian and English, category, specialty, register-aware wording, aliases, relations, and verification metadata. Extend clinical phrases with full kana and romaji plus speaker, consultation stage, formality, tags, related diseases, and related terms. Add structured medication and investigation entities without forcing clinical dosing into J-Med.

Add a relation helper in `lib/content/relations.ts` or the existing content relation boundary. It resolves stable IDs and exposes typed helpers such as `relatedForTerm`, `relatedForDisease`, `relatedForSymptom`, and `coverageReport`. It must tolerate incomplete mappings and return explicit missing-reference diagnostics.

Add an RFSmed inventory adapter in `lib/content/rfsmed.ts`. The adapter represents inventory concepts and mapping state, supports a local starter snapshot, and keeps source URL and source label metadata. It must not fetch or copy decision-support content into the UI at runtime.

### Search layer

Extend the existing local index in `lib/search/index.ts` rather than creating a second search implementation. Search fields include Japanese, kana, romaji, Indonesian, English, aliases, tags, patient wording, consultation intent, and related labels. Result groups include terms, symptoms, diseases, drugs, investigations, procedures, phrases, cases, and readings.

Add an optional server-side Jisho lookup endpoint only for user-initiated general-language enrichment. The endpoint should validate and bound the query, return a typed, clearly labeled draft result, and never merge Jisho data into curated clinical collections automatically.

### Personal settings and persistence

Extend local-first settings in `lib/store/types.ts`, the provider, storage validation, and settings UI with:

- `furigana`: `always | difficult | off` (preserving existing behavior through a migration);
- `romaji`: `always | hover | off`;
- `showIndonesian` and `showEnglish`;
- `medicalDisplayOrder` fixed to Japanese → kana → romaji → Indonesian for this slice.

The existing browser-local profile remains the persistence boundary. New fields must have defaults and import older profiles safely.

### UI layer

Keep existing routes and components, adding focused components under `components/medical/` for:

- `MedicalLanguageControls`;
- `MedicalTermDisplay` / phrase surface display enhancements;
- `RelatedContent`;
- `JUnitMode`;
- `CoverageDashboard`.

The J-Unit route is `/medical/j-unit` and is optimized for a narrow viewport with a sticky next-step control, stage progress, a quick stage picker, and ready-to-say phrase cards.

## Data flow

1. Curated local data is parsed by Zod at module load.
2. Derived maps and the universal local search index are built from the parsed collections.
3. UI pages request typed content and related content by stable ID.
4. User display preferences are read from the local profile and applied to medical surfaces.
5. SRS buttons call the existing `StudyActions` API with `medical-term`, `clinical-phrase`, `disease`, or `symptom` content types.
6. Coverage is computed from the RFSmed inventory snapshot and curated mapping fields, never inferred from UI visibility.
7. Jisho is used only after an explicit user action and returns a draft-enrichment result with source metadata.

## J-Unit stages

The first implementation supports these ordered stages:

`greeting`, `identification`, `chief-complaint`, `hpi`, `associated-symptoms`, `red-flags`, `pmh`, `medication`, `allergy`, `family`, `social`, `examination`, `differential`, `investigation`, `test-instructions`, `results`, `diagnosis`, `treatment`, `medication-instructions`, `consent`, `referral`, `admission`, `discharge`, `follow-up`, `safety-netting`, `closing`.

Each stage has a stable Indonesian label, stage guidance, and one or more phrases. Phrase cards render Japanese, kana, romaji, Indonesian, optional English, speaker, register, and related content.

## Error and empty states

- Search: show a clear no-result state with query-preserving links to J-Unit and Jisho draft lookup.
- J-Unit: show a stage-empty state with navigation to the phrasebook and the next populated stage.
- Coverage: show incomplete mappings as actionable draft items, never as complete coverage.
- Jisho: show unavailable / rate-limited state without blocking curated search.
- Content relations: show missing links as `Not mapped yet`, never broken links.
- Local storage: reuse existing recovery/error messaging.

## Verification strategy

- Extend content integrity tests to reject missing medical romaji and missing phrase full kana/romaji.
- Add search tests for Japanese, kana, romaji, Indonesian, English, patient wording, and grouped result types.
- Add relation tests for disease → symptoms/tests/phrases and symptom → diseases.
- Add settings migration tests for older profiles.
- Add J-Unit stage and phrase-render tests.
- Run `npm test`, `npm run typecheck`, and `npm run build` before claiming completion.
- Manually verify mobile and desktop layouts and keyboard access for search, stage navigation, and SRS actions.

## Out of scope for this slice

- Full manual translation of every RFSmed concept.
- Duplicating RFSmed dosing, calculators, scores, or clinical decision support.
- User accounts, server databases, payments, social features, or a generic medical chatbot.
- Automatic promotion of Jisho or machine-generated text to verified medical Japanese.

