import { describe, expect, it } from 'vitest';
import { buildEncounterFlow, findEncounterSubjects, getCommonEncounterDiseases } from '@/lib/content/encounter-flow';
import { DISEASES, SYMPTOMS } from '@/lib/content';
import { buildSearchIndex, searchDocs } from '@/lib/search';

const encounterSearch = (query: string) => findEncounterSubjects(query);
const searchIndex = buildSearchIndex();

describe('primary-care clinical discovery', () => {
  it('finds both cervical and lumbar HNP from Indonesian and common shorthand', () => {
    for (const query of ['HNP', 'hernia nukleus pulposus', 'saraf kejepit']) {
      const diseases = encounterSearch(query).filter((item) => item.kind === 'disease');
      expect(diseases.some((item) => item.english === 'lumbar disc herniation'), query).toBe(true);
      expect(diseases.some((item) => item.english === 'cervical disc herniation'), query).toBe(true);
    }
  });

  it('connects radiating back pain searches to the symptom and relevant spine diagnoses', () => {
    const results = encounterSearch('nyeri menjalar');
    expect(results.some((item) => item.id === 'sym-youtsuu')).toBe(true);
    expect(results.some((item) => item.english === 'lumbar disc herniation')).toBe(true);
    expect(results.some((item) => item.english === 'lumbar spinal stenosis')).toBe(true);
  });

  it('surfaces diarrhea as a symptom and as a disease concept with disease-specific HPI', () => {
    const results = encounterSearch('diare akut');
    expect(results.some((item) => item.id === 'sym-geri')).toBe(true);
    const acuteDiarrhea = DISEASES.find((disease) => disease.english === 'acute diarrhea');
    expect(acuteDiarrhea).toBeDefined();
    expect(results.some((item) => item.id === acuteDiarrhea?.id)).toBe(true);

    const hpi = buildEncounterFlow({
      id: acuteDiarrhea!.id,
      kind: 'disease',
      japanese: acuteDiarrhea!.japanese,
      kana: acuteDiarrhea!.kana,
      romaji: acuteDiarrhea!.romaji,
      indonesian: acuteDiarrhea!.indonesian,
      english: acuteDiarrhea!.english,
    }).find((step) => step.id === 'hpi');
    expect(hpi?.coverage.status).toBe('available');
    expect(hpi?.specific.some((item) => item.line.indonesian.includes('Berapa kali BAB'))).toBe(true);
  });

  it('connects every added primary-care disease HPI checklist to fully supported questions', () => {
    const addedIds = [
      'dis-kyuuseigerishou', 'dis-kyuuseiintouen', 'dis-hifuen', 'dis-benpishou',
      'dis-saikinseisekiri', 'dis-teashikuchibyou', 'dis-mashin',
      'dis-reputosupirashou', 'dis-chikungunianetsu',
    ];
    for (const id of addedIds) {
      const disease = DISEASES.find((item) => item.id === id);
      expect(disease, id).toBeDefined();
      const hpi = buildEncounterFlow({
        id: disease!.id,
        kind: 'disease',
        japanese: disease!.japanese,
        kana: disease!.kana,
        romaji: disease!.romaji,
        indonesian: disease!.indonesian,
        english: disease!.english,
      }).find((step) => step.id === 'hpi');
      expect(hpi?.coverage.status, disease!.english).toBe('available');
      expect(hpi?.coverage.unsupportedCount, disease!.english).toBe(0);
      for (const question of disease!.historyQuestions) {
        expect(hpi?.specific.some((item) => item.line.japanese === question), `${disease!.english}: ${question}`).toBe(true);
      }
    }
  });

  it('indexes the same everyday aliases in universal search', () => {
    const hnp = searchDocs(searchIndex, 'saraf kejepit', 30);
    expect(hnp.some((hit) => hit.type === 'disease' && hit.ja === '腰椎椎間板ヘルニア')).toBe(true);

    const diarrhea = searchDocs(searchIndex, 'mencret', 30);
    expect(diarrhea.some((hit) => hit.type === 'symptom' && hit.ja === '下痢')).toBe(true);
    expect(diarrhea.some((hit) => hit.type === 'disease' && hit.en === 'acute diarrhea')).toBe(true);

    const radiatingPain = searchDocs(searchIndex, 'nyeri menjalar', 30);
    expect(radiatingPain.some((hit) => hit.type === 'symptom' && hit.ja === '腰痛')).toBe(true);
    expect(radiatingPain.some((hit) => hit.type === 'disease' && hit.ja === '腰椎椎間板ヘルニア')).toBe(true);

    expect(encounterSearch('bersin').some((item) => item.kind === 'symptom' && item.japanese === 'くしゃみ')).toBe(true);
    expect(encounterSearch('花粉症').some((item) => item.kind === 'disease' && item.english === 'allergic rhinitis')).toBe(true);
  });

  it('adds condition-specific HPI to previously unlinked high-risk and older-adult diagnoses', () => {
    for (const japanese of ['てんかん', '痛風', '骨粗鬆症', '子宮筋腫', '急性呼吸窮迫症候群', '糖尿病足病変']) {
      const disease = DISEASES.find((item) => item.japanese === japanese);
      expect(disease, japanese).toBeDefined();
      const hpi = buildEncounterFlow({
        id: disease!.id,
        kind: 'disease',
        japanese: disease!.japanese,
        kana: disease!.kana,
        romaji: disease!.romaji,
        indonesian: disease!.indonesian,
        english: disease!.english,
      }).find((step) => step.id === 'hpi');
      expect(hpi?.specific.length, japanese).toBeGreaterThan(0);
      expect(hpi?.specific.every((item) => item.line.kana && item.line.romaji && item.line.indonesian), japanese).toBe(true);
    }
  });

  it('adds structured, fully read HPI prompts for sciatica, myalgia, and itching', () => {
    for (const english of ['sciatica', 'muscle pain; myalgia', 'pruritus; itching']) {
      const symptom = SYMPTOMS.find((item) => item.english === english);
      expect(symptom, english).toBeDefined();
      expect(symptom!.historyTaking.length, english).toBeGreaterThanOrEqual(4);
      for (const prompt of symptom!.historyTaking) {
        expect(prompt.question.kana, english).toBeTruthy();
        expect(prompt.question.romaji, english).toBeTruthy();
        expect(prompt.question.indonesian, english).toBeTruthy();
        expect(prompt.question.english, english).toBeTruthy();
      }
    }
  });

  it('puts high-frequency Indonesian primary-care diseases in quick encounter selection', () => {
    const selected = getCommonEncounterDiseases();
    const terms = selected.map((item) => item.japanese);
    for (const japanese of ['急性下痢症', '感染性腸炎', '急性咽頭炎', '皮膚炎', '便秘症', '腸チフス']) {
      expect(terms).toContain(japanese);
    }
    const kneeOsteoarthritis = selected.find((item) => item.japanese === '変形性膝関節症');
    expect(kneeOsteoarthritis?.kana).toBe('へんけいせいしつかんせつしょう');
    expect(DISEASES.find((disease) => disease.id === kneeOsteoarthritis?.id)?.specialties).toContain('rehabilitation');
  });
});
