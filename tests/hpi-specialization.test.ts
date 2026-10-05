import { describe, expect, it } from 'vitest';
import { PHRASES, SYMPTOMS } from '@/lib/content';

describe('focused HPI content', () => {
  it('uses cough-specific questions instead of a generic pain checklist', () => {
    const coughRows = PHRASES.filter((phrase) => phrase.stage === 'hpi' && phrase.intent.startsWith('咳 ·'));

    expect(coughRows.some((phrase) => /· (location|severity|radiation)$/.test(phrase.intent))).toBe(false);
    expect(coughRows.some((phrase) => phrase.japanese.includes('痰') && /色|量/.test(phrase.japanese))).toBe(true);
    expect(coughRows.some((phrase) => phrase.japanese.includes('二週間'))).toBe(true);
  });

  it('provides several complaint-specific HPI questions for every symptom page', () => {
    const missing = SYMPTOMS.filter((symptom) => symptom.historyTaking.length < 3)
      .map((symptom) => `${symptom.japanese} (${symptom.english})`);
    expect(missing).toEqual([]);
  });

  it('asks clinically relevant questions for complaints beyond cough', () => {
    const questionsFor = (name: string) => SYMPTOMS.find((symptom) => symptom.english === name)?.historyTaking
      .map((prompt) => prompt.question.japanese).join(' ');

    expect(questionsFor('chest pain')).toMatch(/階段|広がります|息苦しさ|冷や汗/);
    expect(questionsFor('abdominal pain')).toMatch(/便|吐き気|月経|妊娠/);
    expect(questionsFor('fever')).toMatch(/体温|寒気|せき|旅行/);
    expect(questionsFor('painful urination')).toMatch(/尿|発熱|脇腹|妊娠/);
    expect(questionsFor('lower back pain')).toMatch(/足|尿|便|股/);
  });

  it('does not expose the old universal pain-dimension checklist as HPI content', () => {
    const generic = PHRASES.filter((phrase) => phrase.stage === 'hpi')
      .filter((phrase) => /^(ask about location|ask about radiation|ask about severity|ask about onset|ask about duration|ask about aggravating factors|ask about relieving factors)$/i.test(phrase.intent));
    expect(generic).toEqual([]);
  });
});
