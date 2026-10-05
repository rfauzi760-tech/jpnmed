import { PHRASES } from './index';
import type { ClinicalPhrase, JUnitStageTag } from './schema';

export const JUNIT_STAGES = [
  ['greeting', 'Greeting', '挨拶'],
  ['patient-identification', 'Patient identification', '本人確認'],
  ['chief-complaint', 'Chief complaint', '主訴'],
  ['hpi', 'History of present illness', '現病歴'],
  ['associated-symptoms', 'Associated symptoms', '随伴症状'],
  ['red-flags', 'Red flags', '危険徴候'],
  ['pmh', 'Past medical history', '既往歴'],
  ['medication', 'Medication history', '内服歴'],
  ['allergy', 'Drug allergies', '薬剤アレルギー'],
  ['family', 'Family history', '家族歴'],
  ['social', 'Social history', '社会歴'],
  ['examination', 'Physical examination', '身体診察'],
  ['diagnosis', 'Differential diagnosis', '鑑別診断'],
  ['investigation', 'Explain investigations', '検査説明'],
  ['treatment', 'Treatment', '治療'],
  ['medication-instructions', 'Medication instructions', '服薬説明'],
  ['consent', 'Consent', '同意説明'],
  ['referral', 'Referral', '紹介'],
  ['admission', 'Admission', '入院'],
  ['discharge', 'Discharge & follow-up', '退院・再診'],
  ['safety-netting', 'Safety-netting', '注意事項'],
  ['closing', 'Closing', '終了'],
] as const satisfies readonly (readonly [JUnitStageTag, string, string])[];

export type JUnitStageId = JUnitStageTag;

const aliases: Record<JUnitStageId, ClinicalPhrase['stage'][]> = {
  greeting: [],
  'patient-identification': [],
  'chief-complaint': ['chief-complaint'],
  hpi: ['hpi'],
  'associated-symptoms': [],
  'red-flags': ['emergency', 'safety-netting'],
  pmh: ['pmh'],
  medication: ['medication'],
  allergy: ['allergy'],
  family: ['family'],
  social: ['social'],
  examination: ['examination'],
  diagnosis: ['diagnosis'],
  investigation: ['investigation'],
  treatment: ['treatment'],
  'medication-instructions': [],
  consent: ['consent'],
  referral: ['referral'],
  admission: ['admission'],
  discharge: ['discharge', 'follow-up'],
  'safety-netting': ['safety-netting'],
  closing: [],
};

export function phrasesForJUnitStage(stage: JUnitStageId): ClinicalPhrase[] {
  const tagged = PHRASES.filter((phrase) => phrase.junitStages.includes(stage));

  if (['greeting', 'patient-identification', 'associated-symptoms', 'medication-instructions', 'closing'].includes(stage)) {
    return tagged;
  }

  if (stage === 'hpi') {
    return PHRASES.filter((phrase) => phrase.stage === 'hpi');
  }

  if (stage === 'red-flags') {
    const urgent = PHRASES.filter((phrase) =>
      ['emergency', 'safety-netting'].includes(phrase.stage) || phrase.junitStages.includes('red-flags'),
    );
    return Array.from(new Map([...tagged, ...urgent].map((phrase) => [phrase.id, phrase])).values());
  }

  const matching = PHRASES.filter((phrase) => aliases[stage].includes(phrase.stage));
  return matching.filter((phrase) => !phrase.junitStages.includes('medication-instructions'));
}
