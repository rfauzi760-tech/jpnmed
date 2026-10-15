import type { PhraseRow, TermRow } from '../builders';
import type { MedicalTermExample } from '../schema';

/** Source inventory stays separate from UI and canonical content IDs. */
export type PdfVocabularyRow = Pick<TermRow, 'ja' | 'kana' | 'en' | 'idn' | 'cat' | 'sp' | 'usage' | 'rel' | 'alt' | 'tags' | 'note' | 'defJa'> & {
  ex?: MedicalTermExample;
  romaji: string;
  sourceKey: 'general' | 'dental' | 'obgyn';
  /** Actual PDF page, not the printed page number on a scanned handout. */
  page: number;
  /** Explicit equivalent canonical spellings; never a related-but-distinct concept. */
  match?: string[];
  register?: 'technical' | 'patient-friendly' | 'patient-expression';
  /** Full source utterances belong in the phrasebook, not the dictionary. */
  phrase?: Pick<PhraseRow, 'stage' | 'speaker'>;
};
