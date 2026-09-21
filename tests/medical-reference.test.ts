import { describe, expect, it } from 'vitest';
import { INVESTIGATIONS, MEDICAL_TERMS, MEDICATIONS, PHRASES, SYMPTOMS, DISEASES } from '@/lib/content';
import { buildSearchIndex, searchDocs } from '@/lib/search';

describe('Indonesian-first medical reference', () => {
  it('requires romaji on every indexed medical concept and clinical phrase', () => {
    expect([...MEDICAL_TERMS, ...SYMPTOMS, ...DISEASES, ...MEDICATIONS, ...INVESTIGATIONS].every((item) => item.romaji.length > 0)).toBe(true);
    expect(PHRASES.every((phrase) => phrase.romaji.length > 0 && phrase.speaker.length > 0)).toBe(true);
  });

  it('searches medication and investigation concepts in the universal index', () => {
    const index = buildSearchIndex();
    expect(searchDocs(index, 'paracetamol').some((hit) => hit.type === 'medication')).toBe(true);
    expect(searchDocs(index, 'rontgen dada').some((hit) => hit.type === 'investigation')).toBe(true);
  });
});
