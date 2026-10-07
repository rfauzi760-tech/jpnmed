import { DISEASES, INVESTIGATIONS, MEDICAL_TERMS, PHRASES, SYMPTOMS } from './index';
import { COMMON_ENCOUNTER_DISEASE_JAPANESE_NAMES } from './data/commonEncounterDiseases';
import { clinicalSearchAliasesFor } from './data/clinicalSearchAliases';
import type { ClinicalLine, ClinicalPhrase, Disease, PhraseStage, Symptom, VerificationStatus } from './schema';

/** Order is communicative; disposition branches are selected by the clinician. */
export const ENCOUNTER_STEPS = [
  { id: 'hpi', labelIndonesian: 'Riwayat keluhan terarah' },
  { id: 'examination', labelIndonesian: 'Pemeriksaan fisik' },
  { id: 'investigation', labelIndonesian: 'Tujuan dan persiapan pemeriksaan penunjang' },
  { id: 'results', labelIndonesian: 'Menjelaskan hasil pemeriksaan' },
  { id: 'diagnosis', labelIndonesian: 'Menjelaskan dugaan diagnosis' },
  { id: 'treatment', labelIndonesian: 'Rencana terapi dan obat' },
  { id: 'consent', labelIndonesian: 'Persetujuan tindakan' },
  { id: 'referral', labelIndonesian: 'Rujukan' },
  { id: 'admission', labelIndonesian: 'Rawat inap' },
  { id: 'discharge', labelIndonesian: 'Pulang' },
  { id: 'follow-up', labelIndonesian: 'Kontrol' },
  { id: 'safety-netting', labelIndonesian: 'Tanda bahaya dan kapan kembali' },
  { id: 'closing', labelIndonesian: 'Menutup konsultasi' },
] as const;

export type EncounterStepId = typeof ENCOUNTER_STEPS[number]['id'];
export type EncounterSubject = Pick<ClinicalLine, 'japanese' | 'kana' | 'romaji' | 'indonesian' | 'english'> & {
  id: string;
  kind: 'symptom' | 'disease';
};

export type EncounterFlowItem = {
  line: ClinicalLine;
  relation: 'symptom-history' | 'key-symptom' | 'disease-field' | 'disease-relation' | 'symptom-term' | 'investigation-relation' | 'general';
  labelIndonesian: string;
  source: {
    kind: 'symptom-history' | 'phrase' | 'disease' | 'investigation';
    id: string;
    subjectId?: string;
    field?: string;
  };
  verificationStatus: VerificationStatus;
  speaker?: ClinicalPhrase['speaker'];
  patientAnswers?: ClinicalLine[];
  focusIndonesian?: string;
  clinicalReasonIndonesian?: string;
};

export type EncounterFlowStep = {
  id: EncounterStepId;
  labelIndonesian: string;
  subjectId: string;
  specific: EncounterFlowItem[];
  general: EncounterFlowItem[];
  requiresClinicianChoice: boolean;
  coverage: {
    /** Available means linked material exists, not that clinical coverage is exhaustive. */
    status: 'available' | 'partial' | 'missing';
    specificCount: number;
    generalCount: number;
    unsupportedCount: number;
    /** Audit references only, not displayable language lines. */
    unresolvedKeySymptoms: string[];
    messageIndonesian: string;
  };
};

const subjects: EncounterSubject[] = [
  ...SYMPTOMS.map((s) => ({ id: s.id, kind: 'symptom' as const, japanese: s.japanese, kana: s.kana, romaji: s.romaji, indonesian: s.indonesian, english: s.english })),
  ...DISEASES.map((d) => ({ id: d.id, kind: 'disease' as const, japanese: d.japanese, kana: d.kana, romaji: d.romaji, indonesian: d.indonesian, english: d.english })),
];

function normalize(text: string) {
  return text.normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '');
}

function normalizeRomaji(text: string) {
  return normalize(text).replace(/ou|oo/g, 'o').replace(/uu/g, 'u');
}

const searchableSubjects = subjects.map((subject) => {
  const disease = subject.kind === 'disease' ? DISEASES.find((d) => d.id === subject.id) : undefined;
  const symptom = subject.kind === 'symptom' ? SYMPTOMS.find((s) => s.id === subject.id) : undefined;
  return { subject, romaji: normalizeRomaji(subject.romaji), texts: [subject.id, subject.japanese, subject.kana,
    subject.romaji, subject.indonesian, subject.english, disease?.layJapanese ?? '',
    ...clinicalSearchAliasesFor(subject.id),
    ...(symptom?.patientExpressions ?? [])].map(normalize) };
});

/** No arbitrary result limit; consumers may progressively render results. */
export function findEncounterSubjects(query: string): EncounterSubject[] {
  const needle = normalize(query);
  const romanNeedle = normalizeRomaji(query);
  return searchableSubjects.filter((entry) => entry.texts.some((text) => text.includes(needle))
    || entry.romaji.includes(romanNeedle)).map((entry) => ({ ...entry.subject }));
}

const diseaseSubjectsByJapanese = new Map(subjects
  .filter((subject) => subject.kind === 'disease')
  .map((subject) => [subject.japanese, subject]));

/** Common browse choices resolve to existing disease records and their stable IDs. */
export function getCommonEncounterDiseases(): EncounterSubject[] {
  return COMMON_ENCOUNTER_DISEASE_JAPANESE_NAMES.map((japanese) => {
    const disease = diseaseSubjectsByJapanese.get(japanese);
    if (!disease) throw new Error(`Common encounter disease is missing from the catalog: ${japanese}`);
    return { ...disease };
  });
}

function complete(line: ClinicalLine | undefined): line is ClinicalLine {
  return Boolean(line && [line.japanese, line.kana, line.romaji, line.indonesian].every((s) => typeof s === 'string' && s.trim()));
}

const stages: Record<EncounterStepId, readonly PhraseStage[]> = {
  hpi: ['hpi', 'pmh', 'medication', 'allergy', 'family', 'social'],
  examination: ['examination'], investigation: ['investigation'], results: [],
  diagnosis: ['diagnosis'], treatment: ['treatment', 'medication'], consent: ['consent'],
  referral: ['referral'], admission: ['admission'], discharge: ['discharge'],
  'follow-up': ['follow-up'], 'safety-netting': ['safety-netting', 'emergency'], closing: [],
};

// Explicit result-utterance mapping. Neither diagnosis stage membership nor
// a specialty tag is evidence that a phrase discusses an actual test result.
const resultUtterances = new Map([
  ['Explain normal result with uncertainty', '今回の検査では大きな異常は見つかりませんでした。'],
  ['Explain a result is pending', '一部の結果はまだ出ていません。結果がそろってからご説明します。'],
  ['State that nothing serious was found', '今のところ重症な所見はありません。'],
]);

function isResultDiscussion(phrase: ClinicalPhrase) {
  return resultUtterances.get(phrase.intent) === phrase.japanese && complete(phrase);
}

function belongsToStep(phrase: ClinicalPhrase, step: EncounterStepId) {
  if (step === 'results') return isResultDiscussion(phrase);
  if (step === 'closing') return phrase.junitStages.includes('closing');
  if (phrase.junitStages.includes('closing')) return false;
  return stages[step].includes(phrase.stage);
}

// Phrase membership is static content. Index once instead of rescanning the
// entire phrase catalog for every subject and every encounter stage.
const phrasesByStep = Object.fromEntries(ENCOUNTER_STEPS.map(({ id }) => [
  id,
  PHRASES.filter((phrase) => belongsToStep(phrase, id)),
])) as Record<EncounterStepId, ClinicalPhrase[]>;

function phraseItem(phrase: ClinicalPhrase, relation: EncounterFlowItem['relation'], subjectId?: string): EncounterFlowItem {
  return {
    line: phrase,
    relation,
    labelIndonesian: relation === 'general' ? 'Bahasa umum — bukan materi spesifik kondisi' : 'Materi tertaut ke kondisi',
    source: { kind: 'phrase', id: phrase.id, subjectId },
    verificationStatus: phrase.verificationStatus,
    speaker: phrase.speaker,
  };
}

/** Exact key-symptom/curated alias matches only; no substring or specialty inference. */
function keySymptoms(disease: Disease): { symptoms: Symptom[]; unresolved: string[] } {
  const symptoms = new Set<Symptom>();
  const unresolved: string[] = [];
  for (const key of new Set(disease.keySymptoms)) {
    const matches = SYMPTOMS.filter((symptom) => {
      const term = MEDICAL_TERMS.find((t) => t.id === symptom.termId || t.japanese === symptom.japanese);
      const names = [symptom.id, symptom.japanese, ...(term?.alternativeNames ?? [])];
      return names.includes(key) && symptom.historyTaking.some((prompt) => complete(prompt.question));
    });
    if (matches.length === 0) unresolved.push(key);
    for (const match of matches) symptoms.add(match);
  }
  return { symptoms: [...symptoms], unresolved };
}

/** Unsupported Japanese-only fields are counted, never translated at runtime. */
export function buildEncounterFlow(subject: EncounterSubject): EncounterFlowStep[] {
  const symptom = subject.kind === 'symptom' ? SYMPTOMS.find((s) => s.id === subject.id) : undefined;
  const disease = subject.kind === 'disease' ? DISEASES.find((d) => d.id === subject.id) : undefined;
  if (!symptom && !disease) throw new Error(`Unknown encounter subject: ${subject.kind}:${subject.id}`);
  const diseaseSymptoms = disease ? keySymptoms(disease) : { symptoms: [], unresolved: [] };
  const linkedSymptoms = symptom ? [symptom] : diseaseSymptoms.symptoms;
  const linkedTests = disease ? INVESTIGATIONS.filter((test) =>
    test.relatedDiseases.some((ref) => ref === disease.id || ref === disease.japanese)
    || disease.investigations.some((ref) => ref === test.id || ref === test.japanese)) : [];

  return ENCOUNTER_STEPS.map((definition): EncounterFlowStep => {
    const step = definition.id;
    const stepPhrases = phrasesByStep[step];
    const specific: EncounterFlowItem[] = [];
    const unresolvedKeySymptoms = step === 'hpi' ? diseaseSymptoms.unresolved : [];
    let unsupportedCount = unresolvedKeySymptoms.length;
    const add = (item: EncounterFlowItem) => {
      if (!complete(item.line)) { unsupportedCount++; return; }
      if (!specific.some((existing) => existing.line.japanese === item.line.japanese)) specific.push(item);
    };

    if (step === 'hpi') {
      for (const linked of linkedSymptoms) for (const prompt of linked.historyTaking) {
        const answers = prompt.patientAnswers.filter(complete);
        unsupportedCount += prompt.patientAnswers.length - answers.length;
        add({ line: prompt.question, relation: symptom ? 'symptom-history' : 'key-symptom',
          labelIndonesian: symptom ? 'Riwayat khusus gejala' : `Riwayat gejala kunci: ${linked.indonesian}`,
          source: { kind: 'symptom-history', id: prompt.id, subjectId: linked.id },
          verificationStatus: linked.verificationStatus, speaker: 'doctor', patientAnswers: answers,
          focusIndonesian: prompt.focusIndonesian, clinicalReasonIndonesian: prompt.clinicalReasonIndonesian });
      }
    }

    for (const phrase of stepPhrases) {
      if (disease && phrase.relatedDiseaseIds.some((ref) => ref === disease.id || ref === disease.japanese)) {
        add(phraseItem(phrase, 'disease-relation', disease.id));
      } else if (symptom && phrase.relatedTermIds.some((ref) =>
        ref === symptom.id || ref === symptom.termId || ref === symptom.japanese)) {
        add(phraseItem(phrase, 'symptom-term', symptom.id));
      }
    }

    if (disease) {
      const fields: Partial<Record<EncounterStepId, (keyof Disease)[]>> = {
        hpi: ['historyQuestions'], examination: ['examinationPhrases'],
        investigation: ['investigationExplanations'], treatment: ['treatmentPhrases'],
        admission: ['admissionWording'], 'safety-netting': ['redFlagPhrases'],
      };
      for (const field of fields[step] ?? []) {
        const texts = disease[field] as string[];
        for (const text of texts) {
          const phrase = PHRASES.find((p) => p.japanese === text);
          if (phrase) add({ ...phraseItem(phrase, 'disease-field', disease.id), source: { kind: 'phrase', id: phrase.id, subjectId: disease.id, field } });
          // Disease checklists may intentionally point to a complete, structured
          // symptom-HPI question already added above. Reuse that item instead of
          // flagging its Japanese text-only cross-reference as unsupported.
          else if (linkedSymptoms.some((linked) => linked.historyTaking.some((prompt) => prompt.question.japanese === text))) continue;
          else unsupportedCount++;
        }
      }
      if (step === 'diagnosis') {
        for (const [textField, supportField] of [['patientExplanation', 'patientExplanationSupport'], ['causeExplanation', 'causeExplanationSupport']] as const) {
          if (!disease[textField]) continue;
          const support = disease[supportField];
          if (support && support.japanese === disease[textField]) {
            add({ line: support, relation: 'disease-field', labelIndonesian: 'Penjelasan penyakit',
              source: { kind: 'disease', id: disease.id, subjectId: disease.id, field: supportField }, verificationStatus: disease.verificationStatus, speaker: 'doctor' });
          } else {
            const phrase = PHRASES.find((p) => p.japanese === disease[textField]);
            if (phrase) add({ ...phraseItem(phrase, 'disease-field', disease.id), source: { kind: 'phrase', id: phrase.id, subjectId: disease.id, field: textField } });
            else unsupportedCount++;
          }
        }
      }
    }

    if (step === 'investigation' || step === 'results') {
      for (const test of linkedTests) {
        const fields = step === 'results' ? ['resultDiscussion'] as const : ['patientExplanation', 'preparationInstruction'] as const;
        for (const field of fields) {
          const line = test[field];
          if (!line) continue;
          add({ line, relation: 'investigation-relation', labelIndonesian: `${test.indonesian} — bahasa pemeriksaan`,
            source: { kind: 'investigation', id: test.id, subjectId: subject.id, field }, verificationStatus: test.verificationStatus, speaker: 'doctor' });
        }
      }
      if (disease && step === 'investigation') unsupportedCount += disease.investigations.filter((ref) => !linkedTests.some((test) => test.id === ref || test.japanese === ref)).length;
    }

    // General phrases have no condition/term relation. The explicit result map
    // additionally permits setting-neutral result wording tagged by specialty,
    // always labelled general, never condition-specific through that tag.
    const specificText = new Set(specific.map((item) => item.line.japanese));
    const general = stepPhrases.filter((p) => complete(p)
      && p.relatedDiseaseIds.length === 0 && p.relatedTermIds.length === 0
      && (p.specialtyTags.length === 0 || (step === 'results' && isResultDiscussion(p)))
      && !specificText.has(p.japanese)).map((p) => phraseItem(p, 'general'));
    const status = specific.length === 0 ? 'missing' : unsupportedCount ? 'partial' : 'available';
    return { ...definition, subjectId: subject.id, specific, general,
      requiresClinicianChoice: ['referral', 'admission', 'discharge'].includes(step),
      coverage: { status, specificCount: specific.length, generalCount: general.length, unsupportedCount, unresolvedKeySymptoms,
        messageIndonesian: status === 'missing' ? 'Materi spesifik belum tersedia.'
          : status === 'partial' ? unresolvedKeySymptoms.length
            ? 'Sebagian gejala kunci belum tertaut ke riwayat dengan dukungan bahasa lengkap.'
            : 'Sebagian materi tertaut belum memiliki dukungan bahasa lengkap.'
            : 'Materi tertaut tersedia; cakupan klinis belum dinyatakan lengkap.' } };
  });
}
