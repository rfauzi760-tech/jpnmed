import type { PhraseRow } from '../builders';
import { kanaToRomajiFull } from '@/lib/utils/romaji';
import { medicalTermSchema, type MedicalTerm } from '../schema';
import type { PdfVocabularyRow } from './pdfVocabularyTypes';
import { PDF_GENERAL_ANATOMY } from './pdfGeneralAnatomy';
import { PDF_GENERAL_SPECIALTIES } from './pdfGeneralSpecialties';
import { PDF_GENERAL_ENDO_NEURO } from './pdfGeneralEndoNeuro';
import { PDF_GENERAL_CARDIO_OBGYN } from './pdfGeneralCardioObgyn';
import { PDF_DENTAL } from './pdfDental';
import { PDF_OBGYN } from './pdfObgyn';

export const PDF_VOCABULARY_SOURCES = {
  general: 'Kosakata Medis Bahasa Jepang-1.pdf',
  dental: 'kosakata_dokter_gigi_jepang_kanji.pdf',
  obgyn: 'OBGYN_Kotoba_Jepang_Indonesia-1.pdf',
} as const;

export const PDF_VOCABULARY_ROWS: PdfVocabularyRow[] = [
  ...PDF_GENERAL_ANATOMY, ...PDF_GENERAL_SPECIALTIES,
  ...PDF_GENERAL_ENDO_NEURO, ...PDF_GENERAL_CARDIO_OBGYN, ...PDF_DENTAL, ...PDF_OBGYN,
];

export type PdfVocabularyMapping = {
  sourceKey: PdfVocabularyRow['sourceKey'];
  page: number;
  japanese: string;
  contentId: string;
  kind: 'term' | 'phrase';
  action: 'added' | 'merged';
};

const unique = (values: string[]) => [...new Set(values)];
const normalize = (value: string) => value.normalize('NFKC').replace(/\s/g, '');
// Encode Japanese code points, not romaji. ASCII IDs also avoid encoded path
// parameters being treated as different keys during Next.js static generation.
const pdfTermId = (japanese: string) => `med-pdf-${Array.from(normalize(japanese), (char) => char.codePointAt(0)!.toString(36)).join('-')}`;
const sourceNote = (row: PdfVocabularyRow) =>
  `Sumber: ${PDF_VOCABULARY_SOURCES[row.sourceKey]}, halaman PDF ${row.page}.\n${row.ja} — ${row.kana} — ${row.romaji}\n${row.idn} · ${row.en}\n${row.usage ?? ''}\nPembacaan, terjemahan, dan catatan tambahan belum diverifikasi oleh penelaah medis bahasa Jepang.`;

// Full utterances remain discoverable/reviewable in the existing phrasebook.
export const PDF_VOCABULARY_PHRASE_ROWS: PhraseRow[] = PDF_VOCABULARY_ROWS.filter((row) => row.phrase).map((row) => ({
  id: `ph-pdf-${row.sourceKey}-${row.page}-${row.kana.replace(/[。、\s]/g, '')}`,
  ja: row.ja, kana: row.kana, romaji: row.romaji, idn: row.idn, en: row.en,
  intent: row.idn, stage: row.phrase!.stage, speaker: row.phrase!.speaker,
  reg: 'polite', spec: row.sp, rel: row.rel, context: row.usage,
  note: sourceNote(row), v: 'draft',
}));

/** Keep curated IDs, primary translations, verification, and review references.
 * Matching is exact Japanese or an explicitly authored equivalent, never a fuzzy
 * medical-meaning match (e.g. plaque must not collapse into dental calculus).
 */
export function integratePdfVocabulary(base: MedicalTerm[]) {
  const terms = base.map((term) => ({ ...term }));
  const byJapanese = new Map(terms.map((term) => [normalize(term.japanese), term]));
  const mappings: PdfVocabularyMapping[] = [];
  let phraseIndex = 0;
  for (const row of PDF_VOCABULARY_ROWS) {
    if (row.phrase) {
      mappings.push({ sourceKey: row.sourceKey, page: row.page, japanese: row.ja,
        contentId: PDF_VOCABULARY_PHRASE_ROWS[phraseIndex++].id!, kind: 'phrase', action: 'added' });
      continue;
    }
    let term = [row.ja, ...(row.match ?? [])].map((name) => byJapanese.get(normalize(name))).find(Boolean);
    const action = term ? 'merged' : 'added';
    if (!term) {
      term = medicalTermSchema.parse({
        // Japanese, not a transliteration or array position, identifies this addition.
        id: pdfTermId(row.ja), japanese: row.ja, kana: row.kana,
        romaji: row.romaji, english: row.en, indonesian: row.idn,
        category: row.cat, specialties: row.sp, tags: row.tags, definitionJa: row.defJa,
        example: row.ex ? { ...row.ex, romaji: row.ex.romaji ?? kanaToRomajiFull(row.ex.kana) } : undefined,
        usageNote: row.usage, relatedIds: row.rel,
        alternativeNames: unique([...(row.alt ?? []), ...(row.match ?? [])]),
        verificationStatus: 'draft', notes: row.note,
        source: { type: 'personal', title: PDF_VOCABULARY_SOURCES[row.sourceKey], accessedAt: '2026-10-15' },
      });
      terms.push(term);
    } else {
      term.specialties = unique([...term.specialties, ...(row.sp ?? [])]);
      term.relatedIds = unique([...term.relatedIds, ...(row.rel ?? [])]).filter((name) => name !== term!.japanese);
      term.alternativeNames = unique([...term.alternativeNames, row.ja, ...(row.alt ?? []), ...(row.match ?? []),
        ...(row.ja !== term.japanese ? [row.kana, row.romaji] : [])])
        .filter((name) => name !== term!.japanese);
      // Supplement gaps only. Do not overwrite a curated example or reading.
      term.example ??= row.ex ? { ...row.ex, romaji: row.ex.romaji ?? kanaToRomajiFull(row.ex.kana) } : undefined;
      term.usageNote = unique([term.usageNote ?? '', row.usage ?? ''].filter(Boolean)).join('\n\n');
    }
    term.tags = unique([...term.tags, ...(row.tags ?? []), 'pdf-vocabulary', `pdf-${row.sourceKey}`,
      ...(row.register && row.register !== 'technical' ? [`register-${row.register}`] : [])]);
    if (row.ja !== term.japanese && row.register && row.register !== 'technical') {
      const support = { japanese: row.ja, kana: row.kana, romaji: row.romaji,
        indonesian: row.idn, english: row.en, verificationStatus: 'draft' as const,
        languageSupportStatus: 'draft' as const };
      if (row.register === 'patient-friendly' && !term.patientFriendly) {
        term.patientFriendly = row.ja;
        term.patientFriendlySupport = support;
      } else if (row.register === 'patient-expression' && !term.patientExpression) {
        term.patientExpression = row.ja;
        term.patientExpressionSupport = support;
      }
    }
    if (!term.notes?.includes(sourceNote(row))) term.notes = [term.notes, sourceNote(row)].filter(Boolean).join('\n\n');
    byJapanese.set(normalize(row.ja), term);
    byJapanese.set(normalize(term.japanese), term);
    for (const name of row.match ?? []) byJapanese.set(normalize(name), term);
    mappings.push({ sourceKey: row.sourceKey, page: row.page, japanese: row.ja,
      contentId: term.id, kind: 'term', action });
  }
  return { terms, mappings };
}
