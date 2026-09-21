import { PHRASES } from './index';
import type { ClinicalPhrase } from './schema';

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
] as const;

export type JUnitStageId = (typeof JUNIT_STAGES)[number][0];

const aliases: Record<JUnitStageId, ClinicalPhrase['stage'][]> = {
  greeting: ['greeting'],
  'patient-identification': ['greeting'],
  'chief-complaint': ['chief-complaint'],
  hpi: ['hpi'],
  'associated-symptoms': ['hpi'],
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
  'medication-instructions': ['medication'],
  consent: ['consent'],
  referral: ['admission', 'follow-up'],
  admission: ['admission'],
  discharge: ['discharge', 'follow-up'],
  'safety-netting': ['safety-netting'],
  closing: ['discharge', 'follow-up'],
};

export function phrasesForJUnitStage(stage: JUnitStageId): ClinicalPhrase[] {
  return PHRASES.filter((phrase) => aliases[stage].includes(phrase.stage)).slice(0, stage === 'red-flags' ? 8 : 6);
}

