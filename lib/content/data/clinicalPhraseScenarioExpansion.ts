import { P, type PhraseRow } from '../builders';
import type { ClinicalPhrase, JUnitStageTag } from '../schema';
import { SYMPTOMS } from './symptoms';

function encounterStagesForPrompt(focus: string, reason: string): JUnitStageTag[] {
  const text = `${focus} ${reason}`.toLowerCase();
  const stages: JUnitStageTag[] = ['hpi'];
  if (/associated|systemic|related symptoms|other symptoms|gejala penyerta|gejala sistemik/i.test(text)) {
    stages.push('associated-symptoms');
  }
  if (/urgent|red flag|warning|danger|airway|bleeding|faint|stroke|emergency|segera|bahaya|perlu segera/i.test(text)) {
    stages.push('red-flags');
  }
  return stages;
}

export const PHRASES_SCENARIO_EXPANSION: ClinicalPhrase[] = SYMPTOMS.flatMap((symptom) =>
  symptom.historyTaking.flatMap((prompt) => {
    const junitStages = encounterStagesForPrompt(prompt.focusEnglish, prompt.clinicalReasonEnglish);
    const question = P({
      intent: `${symptom.japanese} · ${prompt.focusIndonesian}`,
      ja: prompt.question.japanese,
      kana: prompt.question.kana,
      en: prompt.question.english,
      idn: prompt.question.indonesian,
      reg: 'polite',
      speaker: 'doctor',
      stage: 'hpi',
      junitStages,
      context: `Riwayat terarah: ${symptom.english} · ${prompt.focusEnglish}`,
      nuance: prompt.clinicalReasonIndonesian,
      rel: symptom.relatedTermIds,
      priority: junitStages.includes('red-flags') ? 'essential' : 'common',
    });
    const answers = prompt.patientAnswers.map((answer, index) => P({
      intent: `${symptom.japanese} · jawaban pasien ${index + 1} · ${prompt.focusIndonesian}`,
      ja: answer.japanese,
      kana: answer.kana,
      en: answer.english,
      idn: answer.indonesian,
      reg: 'patient-friendly',
      speaker: 'patient',
      stage: 'hpi',
      junitStages: ['hpi'],
      context: `Contoh jawaban alami pasien: ${symptom.english} · ${prompt.focusEnglish}`,
      rel: symptom.relatedTermIds,
      priority: 'common',
    }));
    return [question, ...answers];
  }),
);

const examRows: PhraseRow[] = [
  { intent: 'respiratory exam · chest exposure', ja: '胸の音を聞きますので、上着を少し開けてください。', kana: 'むねのおとをききますので、うわぎをすこしあけてください。', en: 'I will listen to your chest, so please open your clothing slightly.', idn: 'Saya akan mendengarkan suara dada; silakan buka pakaian luar sedikit.', reg: 'polite', speaker: 'doctor', stage: 'examination', context: 'Respiratory examination', nuance: 'Explain what you are doing before touching or exposing the chest.', spec: ['pulmonology'], rel: ['聴診'], priority: 'essential' },
  { intent: 'respiratory exam · forced expiration', ja: '口をすぼめて、ゆっくり息を吐いてください。', kana: 'くちをすぼめて、ゆっくりいきをはいてください。', en: 'Purse your lips and breathe out slowly.', idn: 'Rapatkan bibir dan buang napas perlahan.', reg: 'polite', speaker: 'doctor', stage: 'examination', context: 'Pulmonary function / respiratory coaching', nuance: '「口をすぼめる」means purse the lips; useful in COPD coaching.', spec: ['pulmonology'], rel: ['呼吸機能検査'], priority: 'common' },
  { intent: 'cardiovascular exam · pulse', ja: '手首に指を当てます。力を抜いてください。', kana: 'てくびにゆびをあてます。ちからをぬいてください。', en: 'I am going to feel your wrist pulse. Please relax.', idn: 'Saya akan memeriksa nadi di pergelangan tangan. Silakan rileks.', reg: 'polite', speaker: 'nurse', stage: 'examination', context: 'Pulse examination', nuance: 'A reassuring explanation before touching the patient.', spec: ['cardiology', 'nursing'], rel: ['脈拍'], priority: 'essential' },
  { intent: 'cardiovascular exam · edema', ja: 'すねを押して、むくみがないか確認します。', kana: 'すねをおして、むくみがないかかくにんします。', en: 'I will press your shin to check for swelling.', idn: 'Saya akan menekan tulang kering untuk memeriksa bengkak.', reg: 'polite', speaker: 'doctor', stage: 'examination', context: 'Peripheral edema examination', nuance: 'Tell the patient why you are pressing the leg.', spec: ['cardiology', 'nephrology'], rel: ['浮腫'], priority: 'common' },
  { intent: 'neurological exam · strength', ja: '私の手を押してください。次に、引いてください。', kana: 'わたしのてをおしてください。つぎに、ひいてください。', en: 'Push against my hands. Now pull.', idn: 'Dorong tangan saya. Sekarang tarik.', reg: 'polite', speaker: 'doctor', stage: 'examination', context: 'Neurological strength testing', nuance: 'Short imperative commands are natural during a focused examination.', spec: ['neurology'], rel: ['筋力低下', '片麻痺'], priority: 'essential' },
  { intent: 'neurological exam · sensation', ja: '左右で感じ方に違いがありますか。', kana: 'さゆうでかんじかたにちがいがありますか。', en: 'Does it feel different on the two sides?', idn: 'Apakah rasanya berbeda di kedua sisi?', reg: 'polite', speaker: 'doctor', stage: 'examination', context: 'Sensory examination', nuance: 'Use while comparing sides; explain the stimulus if needed.', spec: ['neurology'], rel: ['感覚障害', 'しびれ'], priority: 'essential' },
  { intent: 'abdominal exam · guarding', ja: 'おなかの力を抜いて、ゆっくり息をしてください。', kana: 'おなかのちからをぬいて、ゆっくりいきをしてください。', en: 'Relax your abdomen and breathe slowly.', idn: 'Rilekskan perut dan bernapas perlahan.', reg: 'polite', speaker: 'doctor', stage: 'examination', context: 'Abdominal palpation', nuance: 'A gentler instruction before palpation.', spec: ['gastroenterology', 'surgery'], rel: ['腹痛'], priority: 'essential' },
  { intent: 'skin exam · lesion history', ja: '発疹を最初に見つけた場所を教えてください。', kana: 'ほっしんをさいしょにみつけたばしょをおしえてください。', en: 'Please show me where you first noticed the rash.', idn: 'Tolong tunjukkan di mana pertama kali menemukan ruam.', reg: 'polite', speaker: 'doctor', stage: 'examination', context: 'Skin examination', nuance: 'Patients may point rather than name the anatomical site.', spec: ['dermatology'], rel: ['発疹'], priority: 'common' },
  { intent: 'pediatric exam · parent support', ja: 'お子さんを膝の上に抱いたままで大丈夫です。', kana: 'おこさんをひざのうえにだいたままでだいじょうぶです。', en: 'It is fine to keep your child on your lap.', idn: 'Tidak apa-apa tetap memangku anak Anda.', reg: 'polite', speaker: 'nurse', stage: 'examination', context: 'Pediatric examination', nuance: 'A practical reassurance that often helps a frightened child.', spec: ['pediatrics'], rel: ['小児科'], priority: 'common' },
  { intent: 'obstetric exam · fetal monitoring', ja: '赤ちゃんの心拍を確認するため、おなかに機械をつけます。', kana: 'あかちゃんのしんぱくをかくにんするため、おなかにきかいをつけます。', en: 'We will place a monitor on your abdomen to check the baby’s heartbeat.', idn: 'Kami memasang alat di perut untuk memeriksa denyut jantung bayi.', reg: 'polite', speaker: 'nurse', stage: 'examination', context: 'Obstetric fetal monitoring', nuance: 'Patient-friendly 「赤ちゃん」is appropriate when explaining to a pregnant patient.', spec: ['obgyn'], rel: ['妊娠'], priority: 'essential' },
  { intent: 'consent · understanding', ja: 'ここまでの説明で、分からないところはありますか。', kana: 'ここまでのせつめいで、わからないところはありますか。', en: 'Is there anything in the explanation so far that is unclear?', idn: 'Apakah ada bagian dari penjelasan sejauh ini yang belum jelas?', reg: 'polite', speaker: 'doctor', stage: 'consent', context: 'Informed consent', nuance: 'Ask an open question, then check understanding rather than asking only “Do you understand?”', spec: ['hospital-administration'], rel: ['同意書', '説明'], priority: 'essential' },
  { intent: 'consent · teach-back', ja: 'ご自身の言葉で、これから受ける治療を説明していただけますか。', kana: 'ごじしんのことばで、これからうけるちりょうをせつめいしていただけますか。', en: 'Could you explain in your own words the treatment you are going to receive?', idn: 'Bisakah Anda menjelaskan dengan kata-kata sendiri terapi yang akan diterima?', reg: 'formal', speaker: 'doctor', stage: 'consent', context: 'Consent and teach-back', nuance: 'A respectful teach-back check; it is not a test of the patient.', spec: ['hospital-administration'], rel: ['同意書'], priority: 'advanced' },
  { intent: 'telephone · urgent callback', ja: '折り返しのお電話をいただけますか。', kana: 'おりかえしのおでんわをいただけますか。', en: 'Could you call us back?', idn: 'Bisakah Anda menelepon kami kembali?', reg: 'polite', speaker: 'staff', stage: 'follow-up', context: 'Telephone follow-up', nuance: 'Polite hospital-staff wording for asking a patient to call back.', spec: ['hospital-administration'], priority: 'common' },
  { intent: 'pharmacy · medication reconciliation', ja: 'お薬手帳か、今お使いの薬の一覧を見せていただけますか。', kana: 'おくすりてちょうか、いまおつかいのくすりのいちらんをみせていただけますか。', en: 'Could you show me your medication notebook or a list of your current medicines?', idn: 'Bolehkah saya melihat buku obat atau daftar obat yang sedang digunakan?', reg: 'polite', speaker: 'staff', stage: 'medication', context: 'Medication reconciliation at pharmacy', nuance: '「お薬手帳」is a very common Japanese medication-record reference.', spec: ['pharmacy'], rel: ['お薬手帳', '薬歴'], priority: 'essential' },
];

export const PHRASES_SCENARIO_EXAMINATION: ClinicalPhrase[] = examRows.map(P);
