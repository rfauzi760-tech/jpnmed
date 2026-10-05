import { describe, expect, it } from 'vitest';
import { JUNIT_STAGES, phrasesForJUnitStage } from '@/lib/content/junit';

describe('J-Unit stage-specific phrase coverage', () => {
  it('does not reuse greeting phrases as patient identification', () => {
    const greetingIds = new Set(phrasesForJUnitStage('greeting').map((phrase) => phrase.id));
    const identification = phrasesForJUnitStage('patient-identification');

    expect(phrasesForJUnitStage('greeting').length).toBeGreaterThan(8);
    expect(identification.length).toBeGreaterThan(10);
    expect(identification.some((phrase) => !greetingIds.has(phrase.id))).toBe(true);
  });

  it('does not arbitrarily truncate a stage with broader coverage', () => {
    expect(phrasesForJUnitStage('pmh').length).toBeGreaterThan(6);
  });

  it('provides distinct, non-empty content for every encounter stage', () => {
    const stages = JUNIT_STAGES.map(([id]) => [id, phrasesForJUnitStage(id)] as const);
    expect(stages.every(([, phrases]) => phrases.length > 0)).toBe(true);

    const signatures = stages.map(([, phrases]) => phrases.map((phrase) => phrase.id).join(','));
    expect(new Set(signatures).size).toBe(stages.length);
  });

  it('uses actual referral content and a separate medication-counselling collection', () => {
    expect(phrasesForJUnitStage('referral').every((phrase) => phrase.stage === 'referral')).toBe(true);
    expect(phrasesForJUnitStage('referral').length).toBeGreaterThan(20);
    expect(phrasesForJUnitStage('medication-instructions').length).toBeGreaterThan(15);
    expect(phrasesForJUnitStage('medication-instructions').every((phrase) => phrase.junitStages.includes('medication-instructions'))).toBe(true);
  });

  it('makes the large HPI library navigable and excludes generic pain-template prompts', () => {
    const hpi = phrasesForJUnitStage('hpi');
    expect(hpi.length).toBeGreaterThan(500);
    expect(hpi.some((phrase) => phrase.intent.startsWith('咳 ·') && phrase.japanese.includes('痰'))).toBe(true);
    expect(hpi.some((phrase) => /Ask about location|Ask about radiation|Ask about severity/i.test(phrase.intent))).toBe(false);
    expect(phrasesForJUnitStage('associated-symptoms').length).toBeGreaterThan(25);
  });
});
