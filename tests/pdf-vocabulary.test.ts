import { describe, expect, it } from 'vitest';
import { MEDICAL_TERMS, PHRASES, findTermByJapanese, resolveTermRefs, relatedForDisease, DISEASES } from '@/lib/content';
import { PDF_VOCABULARY_COVERAGE } from '@/lib/content/data/medicalTerms';
import { PDF_VOCABULARY_ROWS, integratePdfVocabulary } from '@/lib/content/data/pdfVocabulary';
import { medicalTermSchema } from '@/lib/content/schema';
import { buildSearchIndex, searchDocs } from '@/lib/search';
import { termCard, phraseCard } from '@/lib/content/study';
import { SPECIALTIES } from '@/lib/content/taxonomy';

describe('user PDF vocabulary integration', () => {
  it('accounts for every source row with a canonical term or phrase', () => {
    expect(PDF_VOCABULARY_COVERAGE).toHaveLength(PDF_VOCABULARY_ROWS.length);
    // Based on the actual handout tables, not a target for inflated dictionary counts.
    const minimumGeneralRows = [44, 44, 28, 50, 36, 39, 30, 41, 37, 46];
    for (const [index, count] of minimumGeneralRows.entries()) {
      expect(PDF_VOCABULARY_ROWS.filter((row) => row.sourceKey === 'general' && row.page === index + 1).length, `general page ${index + 1}`).toBeGreaterThanOrEqual(count);
    }
    expect(PDF_VOCABULARY_ROWS.filter((row) => row.sourceKey === 'dental')).toHaveLength(57);
    expect(PDF_VOCABULARY_ROWS.filter((row) => row.sourceKey === 'obgyn')).toHaveLength(78);
    for (const source of ['general', 'dental', 'obgyn']) {
      expect(PDF_VOCABULARY_COVERAGE.some((row) => row.sourceKey === source)).toBe(true);
    }
    for (const row of PDF_VOCABULARY_COVERAGE) {
      const entity = row.kind === 'term' ? MEDICAL_TERMS.find((term) => term.id === row.contentId) : PHRASES.find((phrase) => phrase.id === row.contentId);
      expect(entity, `${row.sourceKey} p${row.page} ${row.japanese}`).toBeDefined();
      expect(entity?.kana).toBeTruthy();
      expect(entity?.romaji).toBeTruthy();
      expect(entity?.indonesian).toBeTruthy();
      const card = row.kind === 'term' ? termCard(row.contentId) : phraseCard(row.contentId);
      expect(card?.romaji).toBe(entity?.romaji);
    }
    for (const row of PDF_VOCABULARY_ROWS) {
      expect(row.kana, row.ja).not.toMatch(/[\u3400-\u9fff]/);
      expect(row.romaji, row.ja).not.toMatch(/[\u3040-\u30ff\u3400-\u9fff]/);
      for (const specialty of row.sp ?? []) {
        expect(SPECIALTIES.some((item) => item.id === specialty), specialty).toBe(true);
      }
    }
    const added = new Set(PDF_VOCABULARY_COVERAGE.filter((row) => row.kind === 'term' && row.action === 'added').map((row) => row.contentId));
    const existing = new Set(PDF_VOCABULARY_COVERAGE.filter((row) => row.kind === 'term' && !added.has(row.contentId)).map((row) => row.contentId));
    console.info('PDF vocabulary audit', { sourceRows: PDF_VOCABULARY_ROWS.length,
      newTerms: added.size, existingTermsEnriched: existing.size, totalTerms: MEDICAL_TERMS.length,
      phrasesAdded: PDF_VOCABULARY_COVERAGE.filter((row) => row.kind === 'phrase').length });
  });

  it('merges overlapping sources without duplicate concepts or changing old review IDs', () => {
    expect(findTermByJapanese('食道')?.id).toBe('med-shokudou');
    expect(findTermByJapanese('食道')?.indonesian).toBe('kerongkongan');
    const keys = MEDICAL_TERMS.map((term) => `${term.japanese}::${term.kana}`);
    expect(new Set(keys).size).toBe(keys.length);
    const ovary = PDF_VOCABULARY_COVERAGE.filter((row) => row.japanese === '卵巣');
    expect(ovary.length).toBeGreaterThanOrEqual(2);
    expect(new Set(ovary.map((row) => row.contentId)).size).toBe(1);
    expect(integratePdfVocabulary([]).terms.map((term) => term.id)).toEqual(integratePdfVocabulary([]).terms.map((term) => term.id));
    for (const row of PDF_VOCABULARY_COVERAGE.filter((item) => item.kind === 'term')) {
      expect(encodeURIComponent(row.contentId)).toBe(row.contentId);
    }
  });

  it('preserves distinct clinical concepts rather than merging inaccurate source glosses', () => {
    expect(findTermByJapanese('歯垢')?.id).not.toBe(findTermByJapanese('歯石')?.id);
    expect(findTermByJapanese('遠視')?.english).toMatch(/hyperopia|hypermetropia/);
    expect(findTermByJapanese('頻尿')?.english).not.toBe('polyuria');
    expect(findTermByJapanese('付属器')?.english).not.toBe('adnexitis');
    expect(findTermByJapanese('おりもの')?.english).toMatch(/discharge/);
    expect(findTermByJapanese('硬膜下麻酔')?.english).toMatch(/subdural/);
    expect(findTermByJapanese('硬膜下麻酔')?.alternativeNames).not.toContain('硬膜外麻酔');
    const interdental = findTermByJapanese('歯間')!;
    expect(findTermByJapanese('歯の隙間')?.id).toBe(interdental.id);
    expect(interdental.patientFriendlySupport).toMatchObject({ japanese: '歯の隙間', kana: 'はのすきま',
      romaji: 'ha no sukima', indonesian: 'celah atau sela di antara gigi', verificationStatus: 'draft' });
  });

  it('makes added content searchable and connected in existing medical pages', () => {
    const index = buildSearchIndex();
    for (const query of ['歯髄', 'しずい', 'shizui', 'pulpa', '胎動', 'gerakan janin', 'NIPT', '肩峰']) {
      expect(searchDocs(index, query, 30).length, query).toBeGreaterThan(0);
    }
    const importedIds = new Set(PDF_VOCABULARY_COVERAGE.filter((row) => row.kind === 'term').map((row) => row.contentId));
    for (const term of MEDICAL_TERMS.filter((item) => importedIds.has(item.id))) {
      expect(medicalTermSchema.safeParse(term).success, term.japanese).toBe(true);
      expect(term.usageNote || term.notes, term.japanese).toBeTruthy();
      expect(resolveTermRefs(term.relatedIds).length, term.japanese).toBeGreaterThan(0);
    }
    const caries = DISEASES.find((disease) => disease.japanese === 'う蝕' || disease.japanese === '虫歯');
    if (caries) expect(relatedForDisease(caries).terms.length).toBeGreaterThan(0);
  });
});
