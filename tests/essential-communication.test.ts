import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PHRASES } from '@/lib/content';
import { ESSENTIAL_GROUPS, filterEssentialGroups } from '@/lib/content/essential';
import { phrasesForJUnitStage } from '@/lib/content/junit';
import { phraseCard } from '@/lib/content/study';
import { buildSearchIndex, searchDocs } from '@/lib/search';
import { JUnitPhraseLine } from '@/components/medical/j-unit-mode';
import { EssentialCommunication } from '@/components/medical/essential-communication';

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

  it('provides full scripts and detailed language lessons for every topic instead of only short phrase cards', () => {
    for (const group of ESSENTIAL_GROUPS) {
      const full = group.phrases.find((phrase) => phrase.id === `ph-essential-${group.id}-full`);
      expect(full, group.id).toBeDefined();
      expect(full!.japanese.split('。').filter(Boolean).length, group.id).toBeGreaterThanOrEqual(4);
      expect(group.guide.words.length, group.id).toBeGreaterThan(0);
      expect(group.guide.grammar.length, group.id).toBeGreaterThan(0);
      for (const entry of group.guide.words) {
        expect([entry.japanese, entry.kana, entry.romaji, entry.indonesian, entry.english, entry.explanation, entry.kanji].every(Boolean), entry.japanese).toBe(true);
      }
      for (const entry of group.guide.grammar) {
        expect([entry.japanese, entry.kana, entry.romaji, entry.meaning, entry.explanation].every(Boolean), entry.japanese).toBe(true);
      }
      for (const key of group.guide.sequence) {
        expect(group.phrases.some((phrase) => phrase.id === `ph-essential-${group.id}-${key}`), `${group.id}: ${key}`).toBe(true);
      }
    }
    const html = renderToStaticMarkup(React.createElement(EssentialCommunication));
    expect(html).toContain('Naskah lengkap siap diucapkan');
    expect(html).toContain('Bedah kosakata &amp; kanji');
    expect(html).toContain('Tata bahasa &amp; nuansa klinis');
    expect(html).toContain('保証申請');
  });

  it('keeps the doctor as speaker when introducing the nurse beside them as interpreter', () => {
    const nurseIntroduction = PHRASES.find((phrase) => phrase.id === 'ph-essential-introduction-nurse')!;
    expect(nurseIntroduction.speaker).toBe('doctor');
    expect(nurseIntroduction.japanese).toContain('通訳');
    const full = PHRASES.find((phrase) => phrase.id === 'ph-essential-introduction-full')!;
    expect(full.speaker).toBe('doctor');
    expect(full.japanese.split('\n')).toHaveLength(6);
    expect(full.japanese).toContain('本日は、看護師の〇〇さんと一緒に診察を担当させていただきます。');
    expect(full.japanese).toContain('もしよろしければ、少しゆっくりお話しいただけると助かります。');
    expect(full.japanese).not.toContain('こちらは、一緒に担当する看護師です');
    for (const text of [full.kana, full.romaji, full.indonesian, full.english]) {
      expect(text.split('\n')).toHaveLength(6);
    }
    expect(full.indonesian).toContain('bersama perawat 〇〇');
    expect(filterEssentialGroups('all', 'hosho shinsei').some((group) => group.id === 'devices')).toBe(true);
    expect(searchDocs(buildSearchIndex(), '保証申請', 20).some((hit) => hit.id === 'ph-essential-devices-full')).toBe(true);
    expect(ESSENTIAL_GROUPS.find((group) => group.id === 'devices')!.guide.words.find((entry) => entry.japanese === '保証申請')!.kanji).toContain('保（ほ / ho）');
  });
});
