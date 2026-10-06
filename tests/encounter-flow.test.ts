import { describe, expect, it } from 'vitest';
import { DISEASES, INVESTIGATIONS, PHRASES, SYMPTOMS } from '@/lib/content';
import { buildEncounterFlow, ENCOUNTER_CONTEXTS, ENCOUNTER_STEPS, findEncounterSubjects } from '@/lib/content/encounter-flow';
import type { EncounterSubject } from '@/lib/content/encounter-flow';

const subjectFor = (kind: EncounterSubject['kind'], id: string) => {
  const subject = findEncounterSubjects('').find((s) => s.kind === kind && s.id === id);
  if (!subject) throw new Error(`Subject not found: ${id}`);
  return subject;
};

describe('subject-linked encounter flow', () => {
  it('maps explicit result-discussion utterances without importing the diagnosis stage', () => {
    const cough = SYMPTOMS.find((s) => s.english === 'cough')!;
    const flow = buildEncounterFlow(subjectFor('symptom', cough.id));
    const results = flow.find((s) => s.id === 'results')!;
    const normal = PHRASES.find((p) => p.japanese === '今回の検査では大きな異常は見つかりませんでした。')!;
    const pending = PHRASES.find((p) => p.intent === 'Explain a result is pending')!;
    expect(results.general.find((item) => item.source.id === normal.id)?.line).toEqual(normal);
    expect(results.general.find((item) => item.source.id === pending.id)?.line).toEqual(pending);
    expect(results.coverage.status).toBe('missing');
    expect([...results.specific, ...results.general].some((item) => item.line.japanese === '今のところ重症な所見はありません。')).toBe(true);
    expect(results.general.some((item) => item.source.id === PHRASES.find((p) => p.intent === 'State the working diagnosis')!.id)).toBe(false);
    expect(results.general.some((item) => item.source.id === PHRASES.find((p) => p.intent === 'Explain the cause in plain language')!.id)).toBe(false);
    expect(results.general.every((item) => item.relation === 'general')).toBe(true);
  });

  it.each([
    ['肺炎', ['膿性の痰']],
    ['糖尿病', ['のどの渇き', '視力のぼやけ']],
  ])('counts unresolved %s key symptoms as HPI coverage gaps', (name, misses) => {
    const disease = DISEASES.find((d) => d.japanese === name)!;
    const hpi = buildEncounterFlow(subjectFor('disease', disease.id)).find((s) => s.id === 'hpi')!;
    const unsupportedQuestions = disease.historyQuestions.filter((text) => !PHRASES.some((p) => p.japanese === text)).length;
    expect(hpi.coverage.unresolvedKeySymptoms).toEqual(expect.arrayContaining(misses));
    expect(hpi.coverage.unsupportedCount).toBe(unsupportedQuestions + hpi.coverage.unresolvedKeySymptoms.length);
    expect(hpi.coverage.status).toBe('partial');
    expect(hpi.specific.some((item) => item.source.kind === 'symptom-history')).toBe(true);
    expect(hpi.coverage.messageIndonesian).toMatch(/gejala kunci/);
  });
  it('finds every catalogued symptom and disease in all five languages without a result cap', () => {
    expect(findEncounterSubjects('')).toHaveLength(SYMPTOMS.length + DISEASES.length);
    for (const [kind, catalog] of [['symptom', SYMPTOMS], ['disease', DISEASES]] as const) {
      for (const entry of catalog) {
        for (const field of ['japanese', 'kana', 'romaji', 'english', 'indonesian'] as const) {
          expect(findEncounterSubjects(entry[field]).some((s) => s.kind === kind && s.id === entry.id), `${entry.id}: ${field}`).toBe(true);
        }
      }
    }
    const cough = SYMPTOMS.find((s) => s.english === 'cough')!;
    expect(findEncounterSubjects('  BATUK  ').some((s) => s.id === cough.id)).toBe(true);
    const diabetes = DISEASES.find((s) => s.japanese === '糖尿病')!;
    expect(findEncounterSubjects('tonyobyo').some((s) => s.id === diabetes.id)).toBe(true);
  });

  it('preserves authored cough questions and natural answers with all reading support', () => {
    const cough = SYMPTOMS.find((s) => s.english === 'cough')!;
    const hpi = buildEncounterFlow(subjectFor('symptom', cough.id)).find((s) => s.id === 'hpi')!;
    for (const prompt of cough.historyTaking) {
      const item = hpi.specific.find((i) => i.source.id === prompt.id);
      expect(item?.line).toEqual(prompt.question);
      expect(item?.patientAnswers).toEqual(prompt.patientAnswers);
    }
    const japanese = hpi.specific.map((i) => i.line.japanese).join(' ');
    expect(japanese).toMatch(/痰/);
    expect(japanese).toMatch(/色/);
    expect(japanese).toMatch(/血/);
    expect(japanese).toMatch(/二週間/);
  });

  it('links disease HPI to exact supported key symptoms and not a whole specialty', () => {
    const pneumonia = DISEASES.find((d) => d.japanese === '肺炎')!;
    const hpi = buildEncounterFlow(subjectFor('disease', pneumonia.id)).find((s) => s.id === 'hpi')!;
    const cough = SYMPTOMS.find((s) => s.english === 'cough')!;
    expect(hpi.specific.some((i) => i.source.subjectId === cough.id)).toBe(true);
    expect(hpi.specific.every((i) => i.relation !== 'general')).toBe(true);
  });

  it('provides each stage and complete language lines with auditable source relations for every subject', () => {
    const failures: string[] = [];
    for (const subject of findEncounterSubjects('')) {
      const flow = buildEncounterFlow(subject);
      expect(flow.map((s) => s.id)).toEqual(ENCOUNTER_STEPS.map((s) => s.id));
      for (const step of flow) {
        expect(step.coverage.specificCount).toBe(step.specific.length);
        expect(step.coverage.generalCount).toBe(step.general.length);
        for (const item of [...step.specific, ...step.general]) {
          for (const line of [item.line, ...(item.patientAnswers ?? [])]) {
            for (const field of ['japanese', 'kana', 'romaji', 'indonesian']) {
              if (!line[field as keyof typeof line]?.trim()) failures.push(`${subject.id}/${step.id}/${item.source.id}: ${field}`);
            }
          }
          expect(item.source.id).toBeTruthy();
        }
        expect(step.general.every((i) => i.relation === 'general' && i.labelIndonesian === 'Bahasa umum — bukan materi spesifik kondisi')).toBe(true);
        expect(step.specific.every((i) => i.relation !== 'general')).toBe(true);
      }
    }
    expect(failures).toEqual([]);
  });

  it('makes all three content contexts available for every subject without triage or urgency changes', () => {
    expect(ENCOUNTER_CONTEXTS.map((context) => context.id)).toEqual(['outpatient', 'emergency', 'inpatient']);
    const severityBefore = DISEASES.map((d) => d.severity);
    const failures: string[] = [];
    for (const subject of findEncounterSubjects('')) for (const step of buildEncounterFlow(subject)) {
      if (step.contexts.join(',') !== 'outpatient,emergency,inpatient') failures.push(`${subject.id}/${step.id}`);
      expect(step).not.toHaveProperty('recommendedContext');
      expect(step).not.toHaveProperty('urgency');
    }
    expect(failures).toEqual([]);
    expect(DISEASES.map((d) => d.severity)).toEqual(severityBefore);
  });

  it('never treats specialty overlap, related differentials, or a broad related term as a subject relation', () => {
    for (const subject of findEncounterSubjects('')) {
      for (const step of buildEncounterFlow(subject)) {
        for (const item of step.specific) {
          if (item.relation === 'disease-relation') {
            const phrase = PHRASES.find((p) => p.id === item.source.id)!;
            expect(subject.kind).toBe('disease');
            expect(phrase.relatedDiseaseIds.some((id) => id === subject.id || id === subject.japanese)).toBe(true);
          }
          if (item.relation === 'investigation-relation') {
            const test = INVESTIGATIONS.find((p) => p.id === item.source.id)!;
            const disease = DISEASES.find((d) => d.id === subject.id)!;
            expect(subject.kind).toBe('disease');
            expect(test.relatedDiseases.some((id) => id === disease.id || id === disease.japanese)
              || disease.investigations.includes(test.id) || disease.investigations.includes(test.japanese)).toBe(true);
          }
          if (item.relation === 'disease-field') {
            const disease = DISEASES.find((d) => d.id === subject.id)!;
            const field = disease[item.source.field as keyof typeof disease];
            expect(Array.isArray(field) ? field.some((text) => text === item.line.japanese)
              : typeof field === 'string' ? field === item.line.japanese
                : field && typeof field === 'object' && 'japanese' in field && field.japanese === item.line.japanese).toBeTruthy();
          }
          if (item.relation === 'symptom-term') {
            const phrase = PHRASES.find((p) => p.id === item.source.id)!;
            const symptom = SYMPTOMS.find((s) => s.id === subject.id)!;
            expect(phrase.relatedTermIds.some((ref) => ref === symptom.id || ref === symptom.termId || ref === symptom.japanese)).toBe(true);
          }
        }
        for (const item of step.general) {
          const phrase = PHRASES.find((p) => p.id === item.source.id)!;
          expect(phrase.relatedDiseaseIds).toEqual([]);
          expect(phrase.relatedTermIds).toEqual([]);
          if (step.id !== 'results') expect(phrase.specialtyTags).toEqual([]);
          else expect(['Explain normal result with uncertainty', 'Explain a result is pending', 'State that nothing serious was found']).toContain(phrase.intent);
        }
      }
    }
  });

  it('reports untranslated disease fields and preserves source verification instead of fabricating support', () => {
    const disease = DISEASES.find((d) => d.examinationPhrases.some((text) => !PHRASES.some((p) => p.japanese === text)))!;
    const step = buildEncounterFlow(subjectFor('disease', disease.id)).find((s) => s.id === 'examination')!;
    expect(step.coverage.unsupportedCount).toBeGreaterThan(0);
    expect(step.coverage.status).not.toBe('available');
    for (const subject of findEncounterSubjects('')) for (const step of buildEncounterFlow(subject)) {
      for (const item of [...step.specific, ...step.general]) {
        if (item.source.kind === 'phrase') expect(item.verificationStatus).toBe(PHRASES.find((p) => p.id === item.source.id)!.verificationStatus);
        if (item.source.kind === 'investigation') expect(item.verificationStatus).toBe(INVESTIGATIONS.find((p) => p.id === item.source.id)!.verificationStatus);
      }
    }
  });

  it('keeps missing condition-specific content visible even when general language exists', () => {
    const flow = buildEncounterFlow(subjectFor('symptom', SYMPTOMS.find((s) => s.english === 'cough')!.id));
    const admission = flow.find((s) => s.id === 'admission')!;
    expect(admission.specific).toEqual([]);
    expect(admission.coverage.status).toBe('missing');
    expect(admission.coverage.messageIndonesian).toMatch(/spesifik belum tersedia/);
    expect(admission.general.length).toBeGreaterThan(0);
    expect(flow.filter((s) => ['referral', 'admission', 'discharge'].includes(s.id)).every((s) => s.requiresClinicianChoice)).toBe(true);
  });

  it('rejects unknown or mismatched subjects rather than fabricating a flow', () => {
    const subject = subjectFor('symptom', SYMPTOMS[0].id);
    expect(() => buildEncounterFlow({ ...subject, id: 'unknown' })).toThrow();
    expect(() => buildEncounterFlow({ ...subject, kind: 'disease' })).toThrow();
  });
});
