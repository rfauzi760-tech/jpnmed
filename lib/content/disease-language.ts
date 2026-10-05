import type { ClinicalLine, ClinicalPhrase, Disease, Investigation, MedicalTerm, Symptom, SymptomHistoryPrompt } from './schema';
import { kanaToRomajiFull } from '@/lib/utils/romaji';
import { INVESTIGATIONS } from './data/investigations';
import { MEDICAL_TERMS } from './data/medicalTerms';
import { PHRASES } from './data/phrases';
import { SYMPTOMS } from './data/symptoms';

/**
 * Disease pages historically stored checklist items as Japanese-only strings.
 * These helpers connect those checklists to the structured phrase, term and
 * investigation records so the page can always show the same language stack:
 * Japanese → kana → romaji → Indonesian → English.
 */

const HISTORY_STAGES = new Set<ClinicalPhrase['stage']>(['chief-complaint', 'hpi', 'pmh', 'medication', 'allergy', 'family', 'social']);
const TREATMENT_STAGES = new Set<ClinicalPhrase['stage']>(['treatment', 'consent', 'admission', 'discharge', 'follow-up', 'safety-netting']);

const TEST_ALIASES: Record<string, { japanese: string; kana: string; indonesian: string; english: string }> = {
  '胸部レントゲン': { japanese: '胸部エックス線検査', kana: 'きょうぶえっくすせんけんさ', indonesian: 'rontgen dada', english: 'chest X-ray' },
  '胸部CT': { japanese: '胸部CT検査', kana: 'きょうぶしーてぃーけんさ', indonesian: 'CT dada', english: 'chest CT' },
  'CT': { japanese: 'CT検査', kana: 'しーてぃーけんさ', indonesian: 'pemeriksaan CT', english: 'CT scan' },
  'MRI': { japanese: 'MRI検査', kana: 'えむあいけんさ', indonesian: 'pemeriksaan MRI', english: 'MRI scan' },
  '心エコー': { japanese: '心エコー検査', kana: 'しんえこーけんさ', indonesian: 'ekokardiografi', english: 'echocardiography' },
  '腹部エコー': { japanese: '腹部超音波検査', kana: 'ふくぶちょうおんぱけんさ', indonesian: 'USG perut', english: 'abdominal ultrasound' },
  '腎エコー': { japanese: '腎臓超音波検査', kana: 'じんぞうちょうおんぱけんさ', indonesian: 'USG ginjal', english: 'renal ultrasound' },
  '上部内視鏡検査': { japanese: '上部消化管内視鏡検査', kana: 'じょうぶしょうかかんないしきょうけんさ', indonesian: 'endoskopi saluran cerna atas', english: 'upper gastrointestinal endoscopy' },
  '上部内視鏡': { japanese: '上部消化管内視鏡検査', kana: 'じょうぶしょうかかんないしきょうけんさ', indonesian: 'endoskopi saluran cerna atas', english: 'upper gastrointestinal endoscopy' },
  '頭部MRI': { japanese: '頭部MRI検査', kana: 'とうぶえむあいけんさ', indonesian: 'MRI kepala', english: 'brain MRI' },
  '頭部画像検査': { japanese: '頭部画像検査', kana: 'とうぶがぞうけんさ', indonesian: 'pencitraan kepala', english: 'head imaging' },
  'アレルギー検査': { japanese: 'アレルギー検査', kana: 'あれるぎーけんさ', indonesian: 'tes alergi', english: 'allergy testing' },
  '血糖': { japanese: '血糖値測定', kana: 'けっとうちそくてい', indonesian: 'pemeriksaan gula darah', english: 'blood glucose measurement' },
  'HbA1c': { japanese: 'HbA1c検査', kana: 'えいちびーえーわんしーけんさ', indonesian: 'pemeriksaan HbA1c', english: 'HbA1c test' },
  '心電図': { japanese: '心電図検査', kana: 'しんでんずけんさ', indonesian: 'elektrokardiografi', english: 'electrocardiogram' },
  '血液検査': { japanese: '血液検査', kana: 'けつえきけんさ', indonesian: 'pemeriksaan darah', english: 'blood test' },
  '尿検査': { japanese: '尿検査', kana: 'にょうけんさ', indonesian: 'pemeriksaan urine', english: 'urine test' },
};

function lineFromPhrase(phrase: ClinicalPhrase): ClinicalLine {
  return {
    japanese: phrase.japanese,
    kana: phrase.kana,
    romaji: phrase.romaji,
    indonesian: phrase.indonesian,
    english: phrase.english,
  };
}

function lineFromTerm(term: MedicalTerm): ClinicalLine {
  return {
    japanese: term.japanese,
    kana: term.kana,
    romaji: term.romaji,
    indonesian: term.indonesian,
    english: term.english,
  };
}

function lineFromSymptom(symptom: Symptom): ClinicalLine {
  return {
    japanese: symptom.japanese,
    kana: symptom.kana,
    romaji: symptom.romaji,
    indonesian: symptom.indonesian,
    english: symptom.english,
  };
}

function lineFromSupport(support: { japanese: string; kana: string; romaji: string; indonesian: string; english: string }): ClinicalLine {
  return {
    japanese: support.japanese,
    kana: support.kana,
    romaji: support.romaji,
    indonesian: support.indonesian,
    english: support.english,
  };
}

function lineFromInvestigation(investigation: Investigation): ClinicalLine {
  return {
    japanese: investigation.japanese,
    kana: investigation.kana,
    romaji: investigation.romaji,
    indonesian: investigation.indonesian,
    english: investigation.english,
  };
}

function unique(lines: ClinicalLine[], limit = 12) {
  const seen = new Set<string>();
  return lines.filter((line) => {
    if (seen.has(line.japanese)) return false;
    seen.add(line.japanese);
    return true;
  }).slice(0, limit);
}

function relevance(disease: Disease, phrase: ClinicalPhrase) {
  const terms = new Set([...disease.relatedTerms, ...disease.keySymptoms]);
  return phrase.relatedDiseaseIds.includes(disease.japanese)
    || phrase.relatedTermIds.some((term) => terms.has(term))
    || phrase.specialtyTags.some((specialty) => disease.specialties.includes(specialty));
}

function phraseLinesFor(disease: Disease, stages: Set<ClinicalPhrase['stage']>, limit: number) {
  const direct = PHRASES.filter((phrase) => stages.has(phrase.stage) && phrase.relatedDiseaseIds.includes(disease.japanese));
  const related = PHRASES.filter((phrase) => stages.has(phrase.stage) && relevance(disease, phrase));
  const broad = PHRASES.filter((phrase) => stages.has(phrase.stage) && phrase.specialtyTags.some((specialty) => disease.specialties.includes(specialty)));
  const fallback = PHRASES.filter((phrase) => stages.has(phrase.stage));
  return unique([...direct, ...related, ...broad, ...fallback].map(lineFromPhrase), limit);
}

export function diseaseExplanationLine(disease: Disease): ClinicalLine {
  const diagnosis = PHRASES.find((phrase) => phrase.stage === 'diagnosis' && phrase.relatedDiseaseIds.includes(disease.japanese));
  if (diagnosis) return lineFromPhrase(diagnosis);

  return {
    japanese: `これは${disease.japanese}という病気です。`,
    kana: `これは${disease.kana}というびょうきです。`,
    romaji: `kore wa ${disease.romaji} to iu byouki desu.`,
    indonesian: `Ini adalah penyakit ${disease.indonesian}.`,
    english: `This is ${disease.english}.`,
  };
}

/**
 * The disease rows pre-date ClinicalLine and keep their long source text as
 * Japanese-only strings. Keep that source text intact, but expose a complete
 * language line beside it so the page never forces the learner to guess the
 * reading or translation.
 */
const CURATED_DETAIL_LINES: Record<string, ClinicalLine> = {
  高血圧: {
    japanese: '血圧が高い状態が続くと、心臓や脳、腎臓の血管に負担がかかります。今は症状がなくても、長い間には脳梗塞や心不全の原因になるため、治療を続けることが大切です。',
    kana: 'けつあつがたかいじょうたいがつづくと、しんぞうやのう、じんぞうのけっかんにふたんがかかります。いまはしょうじょうがなくても、ながいあいだにはのうこうそくやしんふぜんのげんいんになるため、ちりょうをつづけることがたいせつです。',
    romaji: kanaToRomajiFull('けつあつがたかいじょうたいがつづくと、しんぞうやのう、じんぞうのけっかんにふたんがかかります。いまはしょうじょうがなくても、ながいあいだにはのうこうそくやしんふぜんのげんいんになるため、ちりょうをつづけることがたいせつです。'),
    indonesian: 'Jika tekanan darah tinggi terus berlangsung, pembuluh darah jantung, otak, dan ginjal akan terbebani. Meskipun saat ini tidak bergejala, dalam jangka panjang kondisi ini dapat menyebabkan stroke iskemik atau gagal jantung, sehingga penting untuk melanjutkan pengobatan.',
    english: 'When high blood pressure persists, it puts stress on the blood vessels of the heart, brain, and kidneys. Even without symptoms now, it can cause cerebral infarction or heart failure over time, so continuing treatment is important.',
  },
};

const CURATED_CAUSE_LINES: Record<string, ClinicalLine> = {
  高血圧: {
    japanese: '原因がはっきりしないものが多いですが、塩分の取りすぎ、飲酒、肥満、ストレス、遺伝などが関係します。',
    kana: 'げんいんがはっきりしないものがおおいですが、えんぶんのとりすぎ、いんしゅ、ひまん、すとれす、いでんなどがかんけいします。',
    romaji: kanaToRomajiFull('げんいんがはっきりしないものがおおいですが、えんぶんのとりすぎ、いんしゅ、ひまん、すとれす、いでんなどがかんけいします。'),
    indonesian: 'Penyebabnya sering kali tidak jelas, tetapi konsumsi garam berlebihan, alkohol, obesitas, stres, dan faktor keturunan dapat berperan.',
    english: 'The cause is often unclear, but excess salt, alcohol, obesity, stress, and genetics may contribute.',
  },
};

const KEY_SYMPTOM_LINES: Record<string, ClinicalLine> = {
  多くは無症状: {
    japanese: '多くは無症状',
    kana: 'おおくはむしょうじょう',
    romaji: kanaToRomajiFull('おおくはむしょうじょう'),
    indonesian: 'sering kali tanpa gejala',
    english: 'often asymptomatic',
  },
  無症状も多い: {
    japanese: '無症状も多い',
    kana: 'むしょうじょうもおおい',
    romaji: kanaToRomajiFull('むしょうじょうもおおい'),
    indonesian: 'sering kali tanpa gejala',
    english: 'often asymptomatic',
  },
  無症状: {
    japanese: '無症状',
    kana: 'むしょうじょう',
    romaji: kanaToRomajiFull('むしょうじょう'),
    indonesian: 'tanpa gejala',
    english: 'asymptomatic',
  },
};

export function diseaseClinicalDetailLine(disease: Disease): ClinicalLine {
  if (disease.patientExplanationSupport) return disease.patientExplanationSupport;
  const curated = CURATED_DETAIL_LINES[disease.japanese];
  if (curated) return curated;

  const term = MEDICAL_TERMS.find((item) => item.japanese === disease.japanese);
  if (term?.patientFriendlySupport) return lineFromSupport(term.patientFriendlySupport);

  return diseaseExplanationLine(disease);
}

export function diseaseCauseLine(disease: Disease): ClinicalLine {
  if (disease.causeExplanationSupport) return disease.causeExplanationSupport;
  const curated = CURATED_CAUSE_LINES[disease.japanese];
  if (curated) return curated;

  const kana = `${disease.kana}のげんいんはひとつとはかぎりません。`;
  return {
    japanese: `${disease.japanese}の原因は一つとは限りません。`,
    kana,
    romaji: kanaToRomajiFull(kana),
    indonesian: `Penyebab ${disease.indonesian} tidak selalu hanya satu.`,
    english: `There may be more than one cause of ${disease.english}.`,
  };
}

export function diseaseKeySymptomLines(disease: Disease) {
  const lines = disease.keySymptoms.flatMap((key) => {
    const curated = KEY_SYMPTOM_LINES[key];
    if (curated) return [curated];

    const term = MEDICAL_TERMS
      .filter((item) => key.includes(item.japanese) || item.japanese.includes(key))
      .sort((a, b) => b.japanese.length - a.japanese.length)[0];
    if (term) return [lineFromTerm(term)];

    const symptom = SYMPTOMS
      .filter((item) => key.includes(item.japanese) || item.japanese.includes(key))
      .sort((a, b) => b.japanese.length - a.japanese.length)[0]
      ?? SYMPTOMS.find((item) => [
        ...item.patientExpressions,
        ...item.descriptors,
        ...item.severityPhrases,
        ...item.timingPhrases,
        ...item.associatedQuestions,
        ...item.redFlags,
      ].some((text) => text.includes(key) || key.includes(text)));
    return symptom ? [lineFromSymptom(symptom)] : [];
  });

  return unique(lines, disease.keySymptoms.length);
}

export function diseaseHistoryLines(disease: Disease) {
  const exact = disease.historyQuestions
    .map((text) => PHRASES.find((phrase) => phrase.japanese === text))
    .filter((phrase): phrase is ClinicalPhrase => Boolean(phrase))
    .map(lineFromPhrase);
  const relevantTerms = new Set([...disease.relatedTerms, ...disease.keySymptoms]);
  const relevant = PHRASES
    .filter((phrase) => HISTORY_STAGES.has(phrase.stage))
    .filter((phrase) => phrase.relatedDiseaseIds.includes(disease.japanese)
      || phrase.relatedTermIds.some((term) => relevantTerms.has(term)))
    .map(lineFromPhrase);
  const symptomHistory = disease.keySymptoms.flatMap((key) => {
    const symptom = SYMPTOMS
      .filter((item) => key.includes(item.japanese) || item.japanese.includes(key))
      .sort((a, b) => b.japanese.length - a.japanese.length)[0]
      ?? SYMPTOMS.find((item) => [
        ...item.patientExpressions,
        ...item.descriptors,
        ...item.severityPhrases,
        ...item.timingPhrases,
        ...item.associatedQuestions,
        ...item.redFlags,
      ].some((text) => text.includes(key) || key.includes(text)));
    return symptom?.historyTaking.map((prompt) => prompt.question) ?? [];
  });
  return unique([...exact, ...relevant, ...symptomHistory], 14);
}

const symptomKeyAliases: Record<string, string[]> = {
  cough: ['咳', 'せき', '咳嗽', '慢性咳嗽'],
  hemoptysis: ['喀血', '血痰', '咳血'],
  wheezing: ['喘鳴', 'ゼーゼー', 'ヒューヒュー'],
  hoarseness: ['嗄声', '声がかすれる', '声が出にくい'],
  'fatigue; malaise': ['倦怠感', 'だるさ', '疲れやすい'],
  'loss of appetite': ['食欲不振', '食欲低下'],
  'weight loss': ['体重減少', '体重が減る'],
  jaundice: ['黄疸', '皮膚や白目が黄色い'],
  'abdominal distension': ['腹部膨満', 'お腹の張り'],
  dysphagia: ['嚥下障害', '飲み込みにくい'],
  epistaxis: ['鼻出血', '鼻血'],
  'urinary incontinence': ['尿失禁', '尿漏れ'],
  'gait disturbance': ['歩行障害', '歩きにくい'],
  'speech disturbance': ['構音障害', '失語', 'ろれつが回らない', '言葉が出ない'],
  'altered mental status': ['意識障害', '意識変容', '混乱'],
  'mucous bloody stool': ['血便', '粘血便', '血液や粘液が混じる便'],
  'poor feeding': ['哺乳不良', '飲めない', '食べられない'],
  'sputum production': ['痰', '喀痰', '膿性の痰', '血痰', '咳', '咳嗽'],
  fever: ['発熱', '高熱', '微熱', '熱'],
  'chest pain': ['胸痛', '胸の痛み', '胸部不快感'],
  'shortness of breath': ['息切れ', '呼吸困難', '息苦しさ', '呼吸苦'],
  'abdominal pain': ['腹痛', '上腹部痛', '下腹部痛', '腹部不快感'],
  diarrhea: ['下痢', '水様便', '血便', '便通異常'],
  headache: ['頭痛'],
  dizziness: ['めまい', '眩暈', 'ふらつき'],
  'dizziness; vertigo': ['めまい', '眩暈', 'ふらつき'],
  'painful urination': ['排尿痛', '排尿時痛', '頻尿', '尿意切迫'],
  'urinary frequency': ['頻尿', '夜間頻尿', '尿意切迫'],
  'joint pain': ['関節痛', '関節の痛み', '関節腫脹'],
  dysuria: ['排尿痛', '排尿時痛'],
  hematuria: ['血尿', '尿潜血'],
  'difficulty urinating': ['排尿困難', '尿閉', '残尿感'],
  'abnormal uterine bleeding': ['不正出血', '性器出血', '月経異常'],
  'back pain': ['腰痛', '背部痛'],
  'lower back pain': ['腰痛', '腰部痛'],
  orthopnea: ['起坐呼吸', '横になると息苦しい'],
  palpitations: ['動悸'],
  'syncope; fainting': ['失神', '意識消失'],
  rash: ['発疹', '皮疹', 'じんましん'],
  'nausea; vomiting': ['吐き気', '悪心', '嘔吐'],
  vomiting: ['吐き気', '悪心', '嘔吐'],
  weakness: ['脱力', '筋力低下', '片麻痺'],
  numbness: ['しびれ', '感覚障害'],
  seizure: ['けいれん', '痙攣'],
  'pediatric fever': ['発熱', '高熱'],
  'allergic reaction': ['発疹', 'じんましん', 'アレルギー'],
};

export type DiseaseHistoryGroup = {
  id: string;
  titleIndonesian: string;
  titleEnglish: string;
  prompts: SymptomHistoryPrompt[];
  href: string;
};

/** Only surface focused history scripts when a disease's listed symptoms support them. */
export function diseaseHistoryGroups(disease: Disease): DiseaseHistoryGroup[] {
  const isPediatric = disease.specialties.includes('pediatrics');
  const matched = SYMPTOMS.filter((symptom) => {
    if (symptom.historyTaking.length === 0) return false;
    const aliases = symptomKeyAliases[symptom.english.toLowerCase()] ?? [];
    return disease.keySymptoms.some((key) =>
      key === symptom.japanese
      || key.includes(symptom.japanese)
      || aliases.some((alias) => key.includes(alias) || alias.includes(key)),
    );
  });
  const preferred = isPediatric
    ? [...matched].sort((a, b) => Number(b.english === 'fever in child') - Number(a.english === 'fever in child'))
    : matched;
  const seen = new Set<string>();
  return preferred.flatMap((symptom) => {
    const firstQuestion = symptom.historyTaking[0]?.question.japanese;
    if (!firstQuestion || seen.has(firstQuestion)) return [];
    seen.add(firstQuestion);
    return [{
      id: symptom.id,
      titleIndonesian: symptom.indonesian,
      titleEnglish: symptom.english,
      prompts: symptom.historyTaking,
      href: `/medical/symptoms/${encodeURIComponent(symptom.id)}`,
    }];
  }).slice(0, 4);
}

export function diseaseInvestigationLines(disease: Disease) {
  const named = disease.investigations.flatMap((name) => {
    const investigation = INVESTIGATIONS.find((item) => item.japanese === name)
      ?? INVESTIGATIONS.find((item) => item.japanese.includes(name) || name.includes(item.japanese));
    if (investigation) return [lineFromInvestigation(investigation)];
    const term = MEDICAL_TERMS.find((item) => item.japanese === name);
    if (term) return [lineFromTerm(term)];
    const alias = TEST_ALIASES[name];
    return alias ? [{ ...alias, romaji: kanaToRomajiFull(alias.kana) }] : [];
  });
  const contextual = INVESTIGATIONS
    .filter((item) => item.relatedDiseases.includes(disease.japanese) || item.specialties.some((specialty) => disease.specialties.includes(specialty)))
    .map(lineFromInvestigation);
  const phrases = phraseLinesFor(disease, new Set(['investigation']), 6);
  return unique([...named, ...contextual, ...phrases], 14);
}

export function diseaseTreatmentLines(disease: Disease) {
  const exact = disease.treatmentPhrases
    .map((text) => PHRASES.find((phrase) => phrase.japanese === text))
    .filter((phrase): phrase is ClinicalPhrase => Boolean(phrase))
    .map(lineFromPhrase);
  return unique([...exact, ...phraseLinesFor(disease, TREATMENT_STAGES, 14)], 14);
}

export function diseaseDispositionLines(disease: Disease) {
  const exact = disease.admissionWording
    .map((text) => PHRASES.find((phrase) => phrase.japanese === text))
    .filter((phrase): phrase is ClinicalPhrase => Boolean(phrase))
    .map(lineFromPhrase);
  const relevant = PHRASES
    .filter((phrase) => ['referral', 'admission', 'discharge', 'follow-up'].includes(phrase.stage))
    .filter((phrase) => relevance(disease, phrase))
    .map(lineFromPhrase);
  return unique([...exact, ...relevant], 10);
}

export function diseaseExaminationLines(disease: Disease) {
  const exact = disease.examinationPhrases
    .map((text) => PHRASES.find((phrase) => phrase.japanese === text))
    .filter((phrase): phrase is ClinicalPhrase => Boolean(phrase))
    .map(lineFromPhrase);
  return unique([...exact, ...phraseLinesFor(disease, new Set(['examination']), 10)], 10);
}

export function diseaseSafetyLines(disease: Disease) {
  const exact = disease.redFlagPhrases
    .map((text) => PHRASES.find((phrase) => phrase.japanese === text))
    .filter((phrase): phrase is ClinicalPhrase => Boolean(phrase))
    .map(lineFromPhrase);
  const related = PHRASES
    .filter((phrase) => phrase.stage === 'safety-netting' || phrase.stage === 'emergency')
    .filter((phrase) => phrase.relatedDiseaseIds.includes(disease.japanese))
    .map(lineFromPhrase);
  return unique([...exact, ...related], 8);
}

export function diseaseDialoguePhrases(disease: Disease) {
  const linked = PHRASES.filter((phrase) =>
    phrase.relatedDiseaseIds.includes(disease.japanese)
    && ['chief-complaint', 'diagnosis'].includes(phrase.stage),
  );
  const exact = disease.dialogue.flatMap((turn) => {
    const phrase = PHRASES.find((item) => item.japanese === turn.japanese);
    return phrase ? [phrase] : [];
  });
  return [...new Map([...exact, ...linked].map((phrase) => [phrase.id, phrase])).values()]
    .filter((phrase) => ['patient', 'family', 'doctor', 'nurse'].includes(phrase.speaker))
    .sort((a, b) => {
      const order = { patient: 0, family: 1, doctor: 2, nurse: 3, staff: 4 };
      return order[a.speaker] - order[b.speaker];
    })
    .slice(0, 8);
}
