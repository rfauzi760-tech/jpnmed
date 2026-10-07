import { describe, expect, it } from 'vitest';
import { DISEASES, MEDICAL_TERMS, PHRASES, SYMPTOMS, termsByCategory } from '@/lib/content';
import { findEncounterSubjects } from '@/lib/content/encounter-flow';
import {
  diseaseCauseLine,
  diseaseExaminationLines,
  diseaseExplanationLine,
  diseaseHistoryLines,
  diseaseInvestigationLines,
  diseaseKeySymptomLines,
  diseaseTreatmentLines,
} from '@/lib/content/disease-language';

const targetDiseases = ['腸チフス', 'コレラ', '麻疹', '水痘', 'エムポックス', '熱性けいれん', 'てんかん', '麦粒腫', '陥入爪', '爪周囲炎', '結膜炎', '凍瘡', '足白癬', '体部白癬', '頭部白癬'];
const diseaseSpecificPrompt: Record<string, string> = {
  腸チフス: 'ここ数週間に旅行しましたか。現地の水、氷、加熱が不十分な食事で気になったことはありますか。',
  コレラ: '水のような便はいつからですか。今日は何回くらい出て、一回の量は多いですか。',
  麻疹: '発疹はいつ、体のどこから始まりましたか。顔から体へ広がりましたか。',
  水痘: '発疹はどこから始まりましたか。赤いぶつぶつ、水ぶくれ、かさぶたが同時にありますか。',
  エムポックス: '発疹や水ぶくれはいつ始まり、どこに出ていますか。痛みとかゆみはありますか。',
  熱性けいれん: 'お子さんの熱は何度で、熱が出てから何時間後にけいれんが始まりましたか。',
  てんかん: '発作後、意識が戻るまでどのくらいかかりましたか。片側の力が入りにくい状態は残りましたか。',
  麦粒腫: '腫れているところを押すと痛みますか。しこりや膿、目やにはありますか。',
  陥入爪: 'どの指の爪のどちら側が痛みますか。歩くときや靴を履くときに痛みますか。',
  爪周囲炎: 'ずきずきする痛みや膿はありますか。赤みや腫れは広がっていますか。',
  結膜炎: '目やには水っぽいですか、それとも黄色く粘りますか。朝、まぶたがくっつきますか。',
  凍瘡: '手足、耳、頬など、どこに出ていますか。温まるとかゆみや痛みが強くなりますか。',
  足白癬: '皮がむける、白くふやける、ひび割れる、水ぶくれができることはありますか。爪も濁っていますか。',
  体部白癬: '発疹の縁が赤く盛り上がったり、皮がむけたりしていますか。かゆみはありますか。',
  頭部白癬: '頭皮が赤く腫れて痛む、膿が出る、首のリンパ節が腫れることはありますか。',
};

describe('infectious disease and seizure language coverage', () => {
  it('makes requested disease concepts discoverable in the disease terminology category', () => {
    const diseaseTerms = termsByCategory('disease');

    for (const japanese of ['腸チフス', 'コレラ', '麻疹', '水痘', 'エムポックス', '熱性けいれん', '麦粒腫', '陥入爪', '爪周囲炎', '結膜炎', '凍瘡', '足白癬', '体部白癬', '頭部白癬']) {
      expect(diseaseTerms.some((term) => term.japanese === japanese), japanese).toBe(true);
    }
    expect(MEDICAL_TERMS.find((term) => term.japanese === '水痘')?.alternativeNames).toContain('cacar air');
    expect(MEDICAL_TERMS.find((term) => term.japanese === 'エムポックス')?.alternativeNames).toContain('cacar monyet');
    expect(MEDICAL_TERMS.find((term) => term.japanese === '腸チフス')?.alternativeNames).toContain('tipes');
    expect(MEDICAL_TERMS.find((term) => term.japanese === '麻疹')?.alternativeNames).toContain('campak');
    for (const alias of ['bintitan', 'cantengan', 'conjunctivitis', 'しもやけ', 'kutu air', 'たむし', 'しらくも', 'しらくもの', '甲周炎', '甲溝炎', '嵌頓爪', '凍甲', 'cacar']) {
      expect(findEncounterSubjects(alias).length, alias).toBeGreaterThan(0);
    }
    expect(findEncounterSubjects('cacar').filter((subject) => subject.kind === 'disease').length).toBeGreaterThanOrEqual(2);
  });

  it('links specialized HPI prompts to each disease page with complete language support', () => {
    for (const japanese of targetDiseases) {
      const disease = DISEASES.find((item) => item.japanese === japanese);
      expect(disease, japanese).toBeDefined();
      const lines = diseaseHistoryLines(disease!);
      expect(lines.length, `${japanese} HPI`).toBeGreaterThan(0);
      expect(lines.every((line) => line.japanese && line.kana && line.romaji && line.indonesian && line.english), japanese).toBe(true);
      expect(lines.map((line) => line.japanese), `${japanese} must show complaint-specific HPI`).toContain(diseaseSpecificPrompt[japanese]);
      for (const question of disease!.historyQuestions) {
        expect(PHRASES.some((phrase) => phrase.japanese === question && phrase.kana && phrase.romaji && phrase.indonesian), `${japanese}: ${question}`).toBe(true);
      }
    }
    for (const prompt of Object.values(diseaseSpecificPrompt)) {
      expect(PHRASES.some((phrase) => phrase.japanese === prompt && phrase.kana && phrase.romaji && phrase.indonesian), prompt).toBe(true);
    }
  });

  it('keeps patient explanations, symptoms, examination, investigations, and treatment readable in all languages', () => {
    for (const japanese of targetDiseases.slice(7)) {
      const disease = DISEASES.find((item) => item.japanese === japanese)!;
      const lines = [
        diseaseExplanationLine(disease),
        diseaseCauseLine(disease),
        ...diseaseKeySymptomLines(disease),
        ...diseaseExaminationLines(disease),
        ...diseaseInvestigationLines(disease),
        ...diseaseTreatmentLines(disease),
      ];
      expect(lines.length, japanese).toBeGreaterThan(0);
      for (const line of lines) {
        expect([line.japanese, line.kana, line.romaji, line.indonesian, line.english].every(Boolean), `${japanese}: ${line.japanese}`).toBe(true);
      }
    }
  });

  it('provides a dedicated seizure symptom history and complete patient-language lines', () => {
    const seizure = SYMPTOMS.find((item) => item.japanese === 'けいれん');
    expect(seizure).toBeDefined();
    expect(seizure!.historyTaking.length).toBeGreaterThanOrEqual(4);
    for (const prompt of seizure!.historyTaking) {
      expect(prompt.question.japanese).toBeTruthy();
      expect(prompt.question.kana).toBeTruthy();
      expect(prompt.question.romaji).toBeTruthy();
      expect(prompt.question.indonesian).toBeTruthy();
      expect(prompt.question.english).toBeTruthy();
    }
  });
});
