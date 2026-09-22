import type { ClinicalLine, ClinicalPhrase, Disease, Investigation, MedicalTerm } from './schema';
import { kanaToRomajiFull } from '@/lib/utils/romaji';
import { INVESTIGATIONS } from './data/investigations';
import { MEDICAL_TERMS } from './data/medicalTerms';
import { PHRASES } from './data/phrases';

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

export function diseaseHistoryLines(disease: Disease) {
  const exact = disease.historyQuestions
    .map((text) => PHRASES.find((phrase) => phrase.japanese === text))
    .filter((phrase): phrase is ClinicalPhrase => Boolean(phrase))
    .map(lineFromPhrase);
  return unique([...exact, ...phraseLinesFor(disease, HISTORY_STAGES, 14)], 14);
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

export function diseaseExaminationLines(disease: Disease) {
  const exact = disease.examinationPhrases
    .map((text) => PHRASES.find((phrase) => phrase.japanese === text))
    .filter((phrase): phrase is ClinicalPhrase => Boolean(phrase))
    .map(lineFromPhrase);
  return unique([...exact, ...phraseLinesFor(disease, new Set(['examination']), 10)], 10);
}
