import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TermBrowser, type TermRow } from '@/components/medical/term-browser';

vi.stubGlobal('React', React);
vi.mock('@/lib/store/provider', () => ({ useStudy: () => ({ ready: false, state: {
  settings: { medicalDisplay: { furigana: 'always', romaji: 'always', indonesian: true, english: false } }, reviews: {},
} }) }));

describe('medical dictionary pronunciation search', () => {
  it('matches romaji even when it is not part of any meaning or alias', () => {
    const row: TermRow = { id: 'test-pulp', japanese: '歯髄', kana: 'しずい', romaji: 'shizui',
      english: 'dental pulp', indonesian: 'pulpa gigi', category: 'anatomy', specialties: ['dentistry'],
      tags: [], alternativeNames: [], verificationStatus: 'draft', related: 1 };
    const html = renderToStaticMarkup(React.createElement(TermBrowser, { rows: [row], initialQuery: 'shizui' }));
    expect(html).toContain('pulpa gigi');
    expect(html).not.toContain('No terms match');
  });
});
