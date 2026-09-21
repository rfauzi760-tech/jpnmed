import { describe, expect, it } from 'vitest';
import { buildQuickIndex, searchQuickIndex } from '@/lib/content/quick';
import { DISEASES, MEDICAL_TERMS, PHRASES, SYMPTOMS } from '@/lib/content';

const entries = buildQuickIndex();

describe('quick clinical index', () => {
  it('indexes every symptom, disease, term and encounter stage', () => {
    const kinds = new Map<string, number>();
    for (const entry of entries) kinds.set(entry.kind, (kinds.get(entry.kind) ?? 0) + 1);
    expect(kinds.get('symptom')).toBe(SYMPTOMS.length);
    expect(kinds.get('disease')).toBe(DISEASES.length);
    expect(kinds.get('term')).toBe(MEDICAL_TERMS.length);
    expect(kinds.get('stage')).toBe(18);
  });

  it('gives symptoms questions and patients wording', () => {
    const chestPain = entries.find((entry) => entry.id === 'symptom:sym-kyoutsuu');
    expect(chestPain).toBeDefined();
    expect(chestPain!.panel.keyQuestions.length).toBeGreaterThan(0);
    expect(chestPain!.panel.patientWording.length).toBeGreaterThan(0);
  });

  it('carries red flags through to the panel', () => {
    const withFlags = entries.filter((entry) => entry.panel.redFlags.length > 0);
    const symptomFlags = SYMPTOMS.filter((symptom) => symptom.redFlags.length > 0).length;
    const diseaseFlags = DISEASES.filter((disease) => disease.redFlagPhrases.length > 0).length;
    expect(withFlags.length).toBe(symptomFlags + diseaseFlags);
  });
});

describe('quick lookup ranking', () => {
  it('returns nothing for an empty query', () => {
    expect(searchQuickIndex(entries, '   ')).toEqual([]);
  });

  it('finds a symptom by its Japanese surface form', () => {
    const results = searchQuickIndex(entries, '胸痛');
    expect(results[0].ja).toBe('胸痛');
    expect(results[0].kind).toBe('symptom');
  });

  it('finds it by kana and by English too', () => {
    expect(searchQuickIndex(entries, 'きょうつう')[0]?.ja).toBe('胸痛');
    expect(searchQuickIndex(entries, 'chest pain')[0]?.ja).toBe('胸痛');
  });

  it('finds a disease from its Indonesian name', () => {
    const results = searchQuickIndex(entries, 'infark miokard');
    expect(results.some((entry) => entry.ja === '心筋梗塞')).toBe(true);
  });

  it('finds a term from a lay English name', () => {
    const results = searchQuickIndex(entries, 'heart attack');
    expect(results.some((entry) => entry.ja === '心筋梗塞')).toBe(true);
  });

  it('routes an intent-style query to an encounter stage', () => {
    const results = searchQuickIndex(entries, 'how to ask about allergy');
    expect(results.some((entry) => entry.kind === 'stage' && entry.ja === 'アレルギー')).toBe(true);
  });

  it('handles a multi-word Indonesian symptom query', () => {
    const results = searchQuickIndex(entries, 'nyeri dada');
    expect(results[0].ja).toBe('胸痛');
  });

  it('ranks an exact term match above a body-text match', () => {
    const results = searchQuickIndex(entries, '心電図');
    expect(results[0].ja).toBe('心電図');
  });

  it('respects the result limit and never invents entries', () => {
    const results = searchQuickIndex(entries, '痛', 3);
    expect(results.length).toBeLessThanOrEqual(3);
    for (const result of results) {
      expect(entries.some((entry) => entry.id === result.id)).toBe(true);
    }
  });

  it('only offers phrases that exist in the phrasebook', () => {
    const stage = entries.find((entry) => entry.id === 'stage:allergy')!;
    const known = new Set(PHRASES.map((phrase) => phrase.japanese));
    for (const question of stage.panel.keyQuestions) expect(known.has(question)).toBe(true);
  });
});
