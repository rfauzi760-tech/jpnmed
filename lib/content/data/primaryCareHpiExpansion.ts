import { P } from '../builders';
import type { ClinicalPhrase } from '../schema';

/** Disease-specific HPI questions that are not covered by symptom-level prompts. */
export const PRIMARY_CARE_HPI_EXPANSION: ClinicalPhrase[] = [
  P({
    intent: 'Hand-foot-and-mouth · hydration and urine output',
    ja: '口の痛みで水分が取れないことや、尿の回数が減ったことはありますか。',
    kana: 'くちのいたみですいぶんがとれないことや、にょうのかいすうがへったことはありますか。',
    idn: 'Apakah nyeri mulut membuat sulit minum, atau frekuensi buang air kecil berkurang?',
    en: 'Has mouth pain made it difficult to drink, or has urination become less frequent?',
    reg: 'polite', speaker: 'doctor', stage: 'hpi',
    context: 'Child with hand-foot-and-mouth disease · oral intake and dehydration screen',
    spec: ['pediatrics', 'infectious-disease'], diseases: ['手足口病'], priority: 'essential',
  }),
  P({
    intent: 'Measles · vaccination history',
    ja: '麻疹の予防接種を受けたことがありますか。何回受けたか覚えていますか。',
    kana: 'ましんのよぼうせっしゅをうけたことがありますか。なんかいうけたかおぼえていますか。',
    idn: 'Apakah Anda pernah mendapat vaksin campak? Apakah ingat sudah berapa kali?',
    en: 'Have you ever received a measles vaccine? Do you remember how many doses?',
    reg: 'polite', speaker: 'doctor', stage: 'hpi',
    context: 'Suspected measles · immunization and susceptibility assessment',
    spec: ['pediatrics', 'infectious-disease'], diseases: ['麻疹'], priority: 'common',
  }),
  P({
    intent: 'Leptospirosis · floodwater and animal exposure',
    ja: '症状が出る前に、洪水や川の水に触れたり、ネズミのいる環境で作業したりしましたか。',
    kana: 'しょうじょうがでるまえに、こうずいやかわのみずにふれたり、ねずみのいるかんきょうでさぎょうしたりしましたか。',
    idn: 'Sebelum gejala muncul, apakah Anda kontak dengan air banjir/sungai atau bekerja di lingkungan yang banyak tikus?',
    en: 'Before symptoms began, did you contact flood or river water, or work in an area with rats?',
    reg: 'polite', speaker: 'doctor', stage: 'hpi',
    context: 'Suspected leptospirosis · contaminated water and rodent exposure',
    spec: ['primary-care', 'infectious-disease'], diseases: ['レプトスピラ症'], priority: 'common',
  }),
  P({
    intent: 'Chikungunya · mosquito exposure and travel',
    ja: '最近、蚊に刺されたり、デング熱やチクングニア熱が流行している地域へ行ったりしましたか。鼻血や歯ぐきからの出血はありますか。',
    kana: 'さいきん、かにさされたり、でんぐねつやちくんぐにあねつがりゅうこうしているちいきへいったりしましたか。はなぢやはぐきからのしゅっけつはありますか。',
    idn: 'Apakah baru-baru ini Anda digigit nyamuk atau bepergian ke daerah dengan kasus dengue/chikungunya? Apakah ada mimisan atau gusi berdarah?',
    en: 'Have you recently been bitten by mosquitoes or travelled to an area with dengue or chikungunya? Any nose or gum bleeding?',
    reg: 'polite', speaker: 'doctor', stage: 'hpi',
    context: 'Suspected chikungunya · vector exposure and bleeding symptoms relevant to the differential',
    spec: ['primary-care', 'infectious-disease'], diseases: ['チクングニア熱'], priority: 'common',
  }),
];
