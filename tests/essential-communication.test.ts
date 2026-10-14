import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PHRASES } from '@/lib/content';
import { ESSENTIAL_GROUPS, filterEssentialGroups } from '@/lib/content/essential';
import { phrasesForJUnitStage } from '@/lib/content/junit';
import { phraseCard } from '@/lib/content/study';
import { buildSearchIndex, searchDocs } from '@/lib/search';
import { JUnitPhraseLine } from '@/components/medical/j-unit-mode';

vi.stubGlobal('React', React);
const display = vi.hoisted(() => ({ romaji: 'always', furigana: 'always', indonesian: true, english: false }));
vi.mock('@/lib/store/provider', () => ({ useStudy: () => ({ ready: false, state: { settings: { medicalDisplay: display }, reviews: {} } }) }));

describe('essential clinical communication', () => {
  it('connects every essential topic to real phrasebook, stage, and review content with complete readings', () => {
    const ids = new Set<string>();
    for (const group of ESSENTIAL_GROUPS) {
      expect(group.phrases.length).toBeGreaterThan(0);
      for (const phrase of group.phrases) {
        expect(ids.has(phrase.id)).toBe(false);
        ids.add(phrase.id);
        expect(PHRASES).toContain(phrase);
        expect(phrasesForJUnitStage(group.screen)).toContain(phrase);
        expect([phrase.japanese, phrase.kana, phrase.romaji, phrase.indonesian, phrase.english].every(Boolean)).toBe(true);
        expect(phrase.romaji).toContain(' ');
        expect(phraseCard(phrase.id)?.romaji).toBe(phrase.romaji);
        expect(phrase.junitPriority).toBe('essential');
        expect(phrase.verificationStatus).not.toBe('verified');
      }
    }
  });

  it('changes results by topic and searches kana, Japanese, accent-free romaji, and translations', () => {
    expect(filterEssentialGroups('insurance', '').map((group) => group.id)).toEqual(['insurance']);
    expect(filterEssentialGroups('referral', '').map((group) => group.id)).toEqual(['referral']);
    for (const query of ['通訳', 'つうやく', 'tsuyaku', 'penerjemah', 'interpreter']) {
      expect(filterEssentialGroups('all', query).flatMap((group) => group.phrases).length, query).toBeGreaterThan(0);
    }
    expect(filterEssentialGroups('insurance', 'つうやく')).toEqual([]);
    expect(filterEssentialGroups('all', 'zzzzqqq')).toEqual([]);
    expect(searchDocs(buildSearchIndex(), 'リズキ', 20).some((hit) => hit.id === 'ph-essential-introduction-rizki')).toBe(true);
  });

  it('respects display choices and keeps Indonesian visible while English is optional', () => {
    const phrase = ESSENTIAL_GROUPS[0].phrases[0];
    const render = () => renderToStaticMarkup(React.createElement(JUnitPhraseLine, { phrase }));
    const html = render();
    expect(html).toContain(phrase.romaji);
    expect(html).toContain(phrase.kana);
    expect(html).toContain(phrase.indonesian);
    expect(html).not.toContain(phrase.english);
    display.romaji = 'off';
    display.english = true;
    expect(render()).not.toContain(phrase.romaji);
    expect(render()).toContain(phrase.english);
    display.romaji = 'always';
    display.english = false;
  });
});
