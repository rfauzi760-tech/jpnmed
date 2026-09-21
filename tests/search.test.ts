import { describe, expect, it } from 'vitest';
import { buildSearchIndex, searchDocs } from '@/lib/search';

const index = buildSearchIndex();

function top(query: string) {
  const hits = searchDocs(index, query, 5);
  return hits[0];
}

describe('global search', () => {
  it('indexes every searchable entity type', () => {
    const types = new Set(index.map((doc) => doc.type));
    expect(types).toContain('vocabulary');
    expect(types).toContain('grammar');
    expect(types).toContain('medical-term');
    expect(types).toContain('clinical-phrase');
    expect(types).toContain('disease');
    expect(types).toContain('symptom');
    expect(types).toContain('reading');
    expect(types).toContain('case');
  });

  it('finds a Japanese term', () => {
    const hit = top('胸痛');
    expect(hit?.ja).toBe('胸痛');
    expect(hit?.matched).toBe('ja');
  });

  it('finds the same item from its kana reading', () => {
    const hits = searchDocs(index, 'きょうつう', 5);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.ja === '胸痛')).toBe(true);
  });

  it('finds an English term', () => {
    const hits = searchDocs(index, 'chest pain', 5);
    expect(hits.some((hit) => hit.ja === '胸痛')).toBe(true);
  });

  it('finds an Indonesian term', () => {
    const hits = searchDocs(index, 'nyeri dada', 5);
    expect(hits.some((hit) => hit.ja === '胸痛')).toBe(true);
  });

  it('finds a disease by an everyday synonym', () => {
    const hits = searchDocs(index, 'heart attack', 5);
    expect(hits.some((hit) => hit.ja === '心筋梗塞')).toBe(true);
  });

  it('finds a clinical intent phrased in English', () => {
    const hits = searchDocs(index, 'ask about allergy', 8);
    expect(hits.some((hit) => hit.type === 'clinical-phrase')).toBe(true);
  });

  it('finds a romaji reading', () => {
    const hits = searchDocs(index, 'shinkinkousoku', 5);
    expect(hits.some((hit) => hit.ja === '心筋梗塞')).toBe(true);
  });

  it('supports partial matches on English', () => {
    const hits = searchDocs(index, 'hyperten', 5);
    expect(hits.some((hit) => hit.en.toLowerCase().includes('hypertension'))).toBe(true);
  });

  it('reports the field that matched so the UI can show context', () => {
    expect(top('nyeri dada')?.matched).toBe('idn');
    expect(top('chest pain')?.matched).toBe('en');
  });

  it('returns nothing for an unrelated query rather than noise', () => {
    expect(searchDocs(index, 'zzzzqqq', 5)).toHaveLength(0);
  });

  it('handles an empty query', () => {
    expect(searchDocs(index, '   ', 5)).toHaveLength(0);
  });

  it('prefers the exact Japanese surface form over a longer match', () => {
    const hits = searchDocs(index, '心筋梗塞', 3);
    expect(hits[0]?.ja).toBe('心筋梗塞');
  });
});
