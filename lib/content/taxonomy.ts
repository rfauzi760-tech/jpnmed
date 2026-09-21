import type {
  MedicalCategory,
  MistakeCategory,
  PhraseStage,
  ReadingSkill,
} from './schema';

type Label = { en: string; ja?: string; short?: string };

/** Clinical encounter flow. Order matters: it drives the phrasebook. */
export const PHRASE_STAGES: { id: PhraseStage; label: Label; group: 'opening' | 'assessment' | 'explanation' | 'aftercare' }[] = [
  { id: 'greeting', label: { en: 'Greeting & identity', ja: '挨拶', short: 'Greeting' }, group: 'opening' },
  { id: 'chief-complaint', label: { en: 'Chief complaint', ja: '主訴', short: 'Complaint' }, group: 'opening' },
  { id: 'hpi', label: { en: 'History of present illness', ja: '現病歴', short: 'HPI' }, group: 'assessment' },
  { id: 'pmh', label: { en: 'Past medical history', ja: '既往歴', short: 'PMH' }, group: 'assessment' },
  { id: 'medication', label: { en: 'Medication', ja: '内服薬', short: 'Medication' }, group: 'assessment' },
  { id: 'allergy', label: { en: 'Allergy', ja: 'アレルギー', short: 'Allergy' }, group: 'assessment' },
  { id: 'family', label: { en: 'Family history', ja: '家族歴', short: 'Family' }, group: 'assessment' },
  { id: 'social', label: { en: 'Social history', ja: '社会歴', short: 'Social' }, group: 'assessment' },
  { id: 'examination', label: { en: 'Physical examination', ja: '診察', short: 'Examination' }, group: 'assessment' },
  { id: 'investigation', label: { en: 'Investigations', ja: '検査', short: 'Tests' }, group: 'explanation' },
  { id: 'diagnosis', label: { en: 'Diagnosis', ja: '診断', short: 'Diagnosis' }, group: 'explanation' },
  { id: 'treatment', label: { en: 'Treatment', ja: '治療', short: 'Treatment' }, group: 'explanation' },
  { id: 'consent', label: { en: 'Consent & risk', ja: '同意説明', short: 'Consent' }, group: 'explanation' },
  { id: 'admission', label: { en: 'Admission', ja: '入院', short: 'Admission' }, group: 'aftercare' },
  { id: 'referral', label: { en: 'Referral', ja: '紹介', short: 'Referral' }, group: 'aftercare' },
  { id: 'discharge', label: { en: 'Discharge', ja: '退院', short: 'Discharge' }, group: 'aftercare' },
  { id: 'follow-up', label: { en: 'Follow-up', ja: '再診', short: 'Follow-up' }, group: 'aftercare' },
  { id: 'safety-netting', label: { en: 'Safety-netting', ja: '注意事項', short: 'Safety-net' }, group: 'aftercare' },
  { id: 'emergency', label: { en: 'Emergency', ja: '救急', short: 'Emergency' }, group: 'assessment' },
];

export const STAGE_GROUP_LABELS: Record<string, Label> = {
  opening: { en: 'Opening the encounter', ja: '導入' },
  assessment: { en: 'Assessment', ja: '評価' },
  explanation: { en: 'Explanation & planning', ja: '説明' },
  aftercare: { en: 'Admission, discharge & follow-up', ja: '入院・退院' },
};

export const REGISTER_LABELS = {
  'patient-friendly': { en: 'Patient-friendly', ja: 'やさしい表現' },
  polite: { en: 'Polite standard', ja: 'ていねい' },
  formal: { en: 'Formal / professional', ja: 'フォーマル' },
  staff: { en: 'Staff terminology', ja: 'スタッフ用語' },
} as const;

export const MEDICAL_CATEGORIES: { id: MedicalCategory; label: Label }[] = [
  { id: 'symptom', label: { en: 'Symptoms', ja: '症状' } },
  { id: 'sign', label: { en: 'Signs', ja: '所見' } },
  { id: 'disease', label: { en: 'Diseases', ja: '疾患' } },
  { id: 'anatomy', label: { en: 'Anatomy', ja: '解剖' } },
  { id: 'test', label: { en: 'Tests', ja: '検査' } },
  { id: 'imaging', label: { en: 'Imaging', ja: '画像' } },
  { id: 'lab', label: { en: 'Laboratory', ja: '検体' } },
  { id: 'procedure', label: { en: 'Procedures', ja: '処置' } },
  { id: 'surgery', label: { en: 'Surgery', ja: '手術' } },
  { id: 'medication', label: { en: 'Medications', ja: '薬剤' } },
  { id: 'dosage-form', label: { en: 'Dosage forms', ja: '剤形' } },
  { id: 'vital', label: { en: 'Vital signs', ja: 'バイタル' } },
  { id: 'department', label: { en: 'Departments', ja: '診療科' } },
  { id: 'hospital', label: { en: 'Hospital terms', ja: '院内用語' } },
  { id: 'document', label: { en: 'Documents & forms', ja: '書類' } },
  { id: 'emergency', label: { en: 'Emergency', ja: '救急' } },
  { id: 'allergy', label: { en: 'Allergy', ja: 'アレルギー' } },
];

export const SPECIALTIES: { id: string; label: Label }[] = [
  { id: 'internal-medicine', label: { en: 'Internal medicine', ja: '内科' } },
  { id: 'cardiology', label: { en: 'Cardiology', ja: '循環器内科' } },
  { id: 'pulmonology', label: { en: 'Pulmonology', ja: '呼吸器内科' } },
  { id: 'gastroenterology', label: { en: 'Gastroenterology', ja: '消化器内科' } },
  { id: 'neurology', label: { en: 'Neurology', ja: '神経内科' } },
  { id: 'endocrinology', label: { en: 'Endocrinology', ja: '内分泌内科' } },
  { id: 'nephrology', label: { en: 'Nephrology', ja: '腎臓内科' } },
  { id: 'hematology', label: { en: 'Hematology', ja: '血液内科' } },
  { id: 'infectious-disease', label: { en: 'Infectious disease', ja: '感染症内科' } },
  { id: 'emergency-medicine', label: { en: 'Emergency medicine', ja: '救急科' } },
  { id: 'pediatrics', label: { en: 'Pediatrics', ja: '小児科' } },
  { id: 'obstetrics', label: { en: 'Obstetrics & gynecology', ja: '産婦人科' } },
  { id: 'surgery', label: { en: 'Surgery', ja: '外科' } },
  { id: 'orthopedics', label: { en: 'Orthopedics', ja: '整形外科' } },
  { id: 'dermatology', label: { en: 'Dermatology', ja: '皮膚科' } },
  { id: 'ent', label: { en: 'ENT', ja: '耳鼻咽喉科' } },
  { id: 'ophthalmology', label: { en: 'Ophthalmology', ja: '眼科' } },
  { id: 'urology', label: { en: 'Urology', ja: '泌尿器科' } },
  { id: 'psychiatry', label: { en: 'Psychiatry', ja: '精神科' } },
  { id: 'hepatology', label: { en: 'Hepatology', ja: '肝臓内科' } },
  { id: 'oncology', label: { en: 'Oncology', ja: '腫瘍内科' } },
  { id: 'anesthesiology', label: { en: 'Anesthesiology', ja: '麻酔科' } },
  { id: 'intensive-care', label: { en: 'Intensive care', ja: '集中治療科' } },
  { id: 'geriatrics', label: { en: 'Geriatrics', ja: '老年内科' } },
  { id: 'palliative-care', label: { en: 'Palliative care', ja: '緩和ケア科' } },
  { id: 'neonatology', label: { en: 'Neonatology', ja: '新生児科' } },
  { id: 'nutrition', label: { en: 'Clinical nutrition', ja: '栄養科' } },
  { id: 'nursing', label: { en: 'Nursing', ja: '看護部' } },
  { id: 'toxicology', label: { en: 'Toxicology', ja: '中毒学' } },
  { id: 'pharmacy', label: { en: 'Pharmacy', ja: '薬剤部' } },
  { id: 'radiology', label: { en: 'Radiology', ja: '放射線科' } },
];

export const MISTAKE_LABELS: Record<MistakeCategory, Label> = {
  vocabulary: { en: 'Vocabulary', ja: '語彙' },
  grammar: { en: 'Grammar', ja: '文法' },
  negation: { en: 'Missed negation', ja: '否定' },
  contrast: { en: 'Missed contrast', ja: '逆接' },
  inference: { en: 'Inference', ja: '推論' },
  'main-idea': { en: 'Main idea', ja: '主旨' },
  paraphrase: { en: 'Paraphrase', ja: '言い換え' },
  reference: { en: 'Reference tracking', ja: '指示語' },
  rushed: { en: 'Rushed reading', ja: '読み急ぎ' },
  overthinking: { en: 'Overthinking', ja: '考えすぎ' },
  distractor: { en: 'Distractor trap', ja: 'ひっかけ' },
};

export const SKILL_LABELS: Record<ReadingSkill, Label> = {
  'main-idea': { en: 'Main idea', ja: '主旨' },
  detail: { en: 'Detail', ja: '詳細' },
  inference: { en: 'Inference', ja: '推論' },
  reference: { en: 'Reference', ja: '指示関係' },
  paraphrase: { en: 'Paraphrase', ja: '言い換え' },
  'author-intent': { en: 'Author intent', ja: '筆者の意図' },
  structure: { en: 'Structure', ja: '構成' },
};

export const GRAMMAR_FAMILY_LABELS = {
  'contrast-concession': { en: 'Contrast & concession', ja: '逆接・譲歩' },
  limitation: { en: 'Limitation', ja: '限定' },
  'evaluation-certainty': { en: 'Evaluation & certainty', ja: '評価・断定' },
  'negative-nuance': { en: 'Negative nuance', ja: '否定の含み' },
  'cause-basis': { en: 'Cause & basis', ja: '原因・根拠' },
  'change-correlation': { en: 'Change & correlation', ja: '変化・相関' },
  'formal-written': { en: 'Formal written patterns', ja: '書き言葉' },
  condition: { en: 'Condition', ja: '条件' },
  time: { en: 'Time', ja: '時間' },
  reference: { en: 'Reference & scope', ja: '出典・範囲' },
} as const;

export const VOCAB_TAGS = {
  'abstract-noun': 'Abstract noun',
  'formal-written': 'Formal / written',
  'news-language': 'News language',
  'workplace': 'Workplace',
  'connective': 'Logical connector',
  'stance': 'Stance expression',
  'evaluation': 'Evaluation',
  'cause-effect': 'Cause & effect',
  'society': 'Society',
  'science': 'Science',
  'health': 'Health',
  'core': 'Core N2',
  'n1-bridge': 'N1 bridge',
  'trap-word': 'Reading trap word',
  'medical': 'Medical relevance',
  'adjective': 'Adjective',
  'adverb': 'Adverb',
  'katakana': 'Katakana',
} as const;

export const CONTENT_TYPE_LABELS: Record<string, Label> = {
  vocabulary: { en: 'Vocabulary', ja: '語彙' },
  grammar: { en: 'Grammar', ja: '文法' },
  'medical-term': { en: 'Medical term', ja: '医療用語' },
  'clinical-phrase': { en: 'Clinical phrase', ja: '診察表現' },
  disease: { en: 'Disease', ja: '疾患' },
  symptom: { en: 'Symptom', ja: '症状' },
  kanji: { en: 'Kanji', ja: '漢字' },
  reading: { en: 'Reading', ja: '読解' },
  case: { en: 'Clinical case', ja: '症例' },
  note: { en: 'Note', ja: 'ノート' },
};

export function specialtyLabel(id: string) {
  return SPECIALTIES.find((s) => s.id === id)?.label.en ?? id;
}

export function categoryLabel(id: string) {
  return MEDICAL_CATEGORIES.find((c) => c.id === id)?.label.en ?? id;
}

export function stageLabel(id: string) {
  return PHRASE_STAGES.find((s) => s.id === id)?.label.en ?? id;
}

export function tagLabel(id: string) {
  return (VOCAB_TAGS as Record<string, string>)[id] ?? id.replace(/-/g, ' ');
}
