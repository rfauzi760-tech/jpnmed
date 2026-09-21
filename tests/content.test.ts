import { describe, expect, it } from 'vitest';
import {
  CASES,
  CONTENT_STATS,
  DISEASES,
  GRAMMAR,
  MEDICAL_TERMS,
  PHRASES,
  READINGS,
  SYMPTOMS,
  VOCABULARY,
  checkContentIntegrity,
  findTermByJapanese,
  resolveTermRefs,
} from '@/lib/content';
import { kanaToRomaji } from '@/lib/utils/romaji';
import { autoFuriganaTokens } from '@/components/japanese';
import { buildFuriganaDictionary } from '@/lib/content/furigana';

describe('seed content volume', () => {
  it('meets the Seed 2 milestone from IMPLEMENTATION_PLAN.md', () => {
    expect(CONTENT_STATS.vocabulary).toBeGreaterThanOrEqual(100);
    expect(CONTENT_STATS.grammar).toBeGreaterThanOrEqual(30);
    expect(CONTENT_STATS.readings).toBeGreaterThanOrEqual(10);
    expect(CONTENT_STATS.terms).toBeGreaterThanOrEqual(150);
    expect(CONTENT_STATS.phrases).toBeGreaterThanOrEqual(100);
    expect(CONTENT_STATS.diseases).toBeGreaterThanOrEqual(20);
    expect(CONTENT_STATS.cases).toBeGreaterThanOrEqual(10);
  });
});

describe('content integrity', () => {
  const issues = checkContentIntegrity();

  it('reports no errors', () => {
    const errors = issues.filter((issue) => issue.level === 'error');
    expect(errors.map((error) => error.message)).toEqual([]);
  });

  it('keeps unresolved relationship warnings to a minimum', () => {
    const warnings = issues.filter((issue) => issue.level === 'warning');
    // Relationship names are advisory metadata; a handful of near-misses
    // (for example a shorthand like トロポニン) is acceptable.
    expect(warnings.length).toBeLessThan(40);
  });

  it('has unique ids across every collection', () => {
    const ids = [
      ...VOCABULARY.map((v) => v.id),
      ...GRAMMAR.map((g) => g.id),
      ...READINGS.map((r) => r.id),
      ...MEDICAL_TERMS.map((t) => t.id),
      ...SYMPTOMS.map((s) => s.id),
      ...DISEASES.map((d) => d.id),
      ...PHRASES.map((p) => p.id),
      ...CASES.map((c) => c.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('content quality rules', () => {
  it('gives every vocabulary item a kana reading and a translation in both languages', () => {
    for (const word of VOCABULARY) {
      expect(word.kana, word.japanese).toBeTruthy();
      expect(word.meaningsEn.length, word.japanese).toBeGreaterThan(0);
      expect(word.meaningsId.length, word.japanese).toBeGreaterThan(0);
    }
  });

  it('keeps the three medical registers distinct where a lay form exists', () => {
    const withLay = MEDICAL_TERMS.filter((term) => term.patientFriendly);
    expect(withLay.length).toBeGreaterThan(100);
    for (const term of withLay) {
      expect(term.patientFriendly).not.toBe(term.japanese);
      expect(term.english).toBeTruthy();
      expect(term.indonesian).toBeTruthy();
    }
  });

  it('describes prognosis and treatment for every disease page', () => {
    for (const disease of DISEASES) {
      expect(disease.patientExplanation.length, disease.id).toBeGreaterThan(20);
      expect(disease.historyQuestions.length, disease.id).toBeGreaterThanOrEqual(4);
      expect(disease.keySymptoms.length, disease.id).toBeGreaterThanOrEqual(3);
      expect(disease.treatmentPhrases.length, disease.id).toBeGreaterThanOrEqual(3);
      expect(disease.redFlagPhrases.length, disease.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('gives every case a scoring rubric and an answer for each required question', () => {
    for (const clinicalCase of CASES) {
      expect(clinicalCase.requiredQuestions.length, clinicalCase.id).toBeGreaterThanOrEqual(4);
      expect(clinicalCase.patientLines.length, clinicalCase.id).toBeGreaterThanOrEqual(4);
      const topics = new Set(clinicalCase.patientLines.map((line) => line.topic));
      for (const question of clinicalCase.requiredQuestions) {
        expect(topics.has(question.topic), `${clinicalCase.id} · ${question.topic}`).toBe(true);
      }
    }
  });

  it('keeps phrase registers inside the documented set', () => {
    for (const phrase of PHRASES) {
      expect(['patient-friendly', 'polite', 'formal', 'staff']).toContain(phrase.register);
      expect(phrase.kana, phrase.japanese).toBeTruthy();
    }
  });

  it('pairs every patient utterance with a distinct doctor response', () => {
    for (const symptom of SYMPTOMS) {
      expect(symptom.exchanges.length, symptom.japanese).toBeGreaterThanOrEqual(2);
      for (const exchange of symptom.exchanges) {
        expect(exchange.patient, symptom.japanese).toBeTruthy();
        expect(exchange.doctor, symptom.japanese).toBeTruthy();
        expect(exchange.doctor, `${symptom.japanese}: ${exchange.patient}`).not.toBe(exchange.patient);
      }
    }
  });
});

describe('furigana coverage', () => {
  const dictionary = buildFuriganaDictionary();

  it('annotates common prose words found in passages', () => {
    const tokens = autoFuriganaTokens('ご予約の変更が必要な方は、受付でお手続きが必要です。', dictionary);
    const readings = new Map(tokens.filter((t) => t.reading).map((t) => [t.text, t.reading]));
    expect(readings.get('予約')).toBe('よやく');
    expect(readings.get('変更')).toBe('へんこう');
    expect(readings.get('受付')).toBe('うけつけ');
  });

  it('never annotates kana-only text', () => {
    const tokens = autoFuriganaTokens('とてもつらいです。', dictionary);
    expect(tokens.some((token) => token.reading)).toBe(false);
  });

  it('prefers the content database over the common layer', () => {
    // 胸痛 is a medical term: its dictionary reading must come from the term row.
    expect(dictionary['胸痛']).toBe('きょうつう');
  });
});

describe('reading questions', () => {
  it('marks exactly one correct option and keeps the rationale consistent', () => {
    for (const passage of READINGS) {
      for (const question of passage.questions) {
        const correct = question.options.filter((option) => option.why.startsWith('Correct'));
        expect(correct.length, `${passage.id}/${question.id}`).toBe(1);
        expect(question.options[question.correctIndex].why.startsWith('Correct')).toBe(true);
        expect(question.options.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('quotes evidence from the paragraph it points at', () => {
    for (const passage of READINGS) {
      for (const question of passage.questions) {
        const paragraph = passage.paragraphs[question.evidenceParagraph];
        expect(paragraph, `${passage.id}/${question.id}`).toBeTruthy();
        const needle = question.evidenceSentence.slice(0, 10);
        expect(paragraph.text.includes(needle), `${passage.id}/${question.id}`).toBe(true);
      }
    }
  });

  it('labels every distractor with a mistake category', () => {
    for (const passage of READINGS) {
      for (const question of passage.questions) {
        const distractors = question.options.filter((_, index) => index !== question.correctIndex);
        for (const option of distractors) {
          expect(option.trap, `${passage.id}/${question.id}`).toBeTruthy();
        }
      }
    }
  });

  it('derives character counts and reading times', () => {
    for (const passage of READINGS) {
      expect(passage.characterCount).toBeGreaterThan(150);
      expect(passage.estimatedMinutes).toBeGreaterThanOrEqual(2);
      expect(passage.text.length).toBeGreaterThan(passage.characterCount);
    }
  });
});

describe('relationship resolution', () => {
  it('resolves authored Japanese names to term ids', () => {
    const resolved = resolveTermRefs(['胸痛', '心筋梗塞', '心電図']);
    expect(resolved.map((term) => term.japanese)).toEqual(['胸痛', '心筋梗塞', '心電図']);
  });

  it('finds a term by its lay name as patients say it', () => {
    const term = findTermByJapanese('むくみ');
    expect(term?.japanese).toBe('浮腫');
  });

  it('ignores unknown names instead of throwing', () => {
    expect(resolveTermRefs(['存在しない用語'])).toHaveLength(0);
  });
});

describe('id generation', () => {
  it('produces readable romaji ids', () => {
    expect(kanaToRomaji('きょうつう')).toBe('kyoutsuu');
    expect(kanaToRomaji('しんきんこうそく')).toBe('shinkinkousoku');
    expect(kanaToRomaji('あなふぃらきしー')).toBe('anafirakishii');
  });
});
