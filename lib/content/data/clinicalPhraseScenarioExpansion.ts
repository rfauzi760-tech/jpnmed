import { P, type PhraseRow } from '../builders';
import type { ClinicalPhrase } from '../schema';

type Complaint = {
  label: string;
  kana: string;
  indonesian: string;
  english: string;
  specialty: string[];
  disease?: string[];
  term?: string[];
};

const complaints: Complaint[] = [
  { label: '胸痛', kana: 'きょうつう', indonesian: 'nyeri dada', english: 'chest pain', specialty: ['cardiology', 'emergency-medicine'], disease: ['心筋梗塞', '狭心症'], term: ['胸痛'] },
  { label: '息苦しさ', kana: 'いきぐるしさ', indonesian: 'sesak napas', english: 'breathlessness', specialty: ['pulmonology', 'emergency-medicine'], disease: ['喘息', '肺炎'], term: ['呼吸困難'] },
  { label: '動悸', kana: 'どうき', indonesian: 'palpitasi', english: 'palpitations', specialty: ['cardiology'], disease: ['心房細動'], term: ['動悸'] },
  { label: '発熱', kana: 'はつねつ', indonesian: 'demam', english: 'fever', specialty: ['internal-medicine', 'infectious-disease'], disease: ['肺炎', 'インフルエンザ'], term: ['発熱'] },
  { label: '咳', kana: 'せき', indonesian: 'batuk', english: 'cough', specialty: ['pulmonology'], disease: ['喘息', '肺炎'], term: ['咳'] },
  { label: '腹痛', kana: 'ふくつう', indonesian: 'nyeri perut', english: 'abdominal pain', specialty: ['gastroenterology', 'surgery'], disease: ['虫垂炎', '胃腸炎'], term: ['腹痛'] },
  { label: '吐き気', kana: 'はきけ', indonesian: 'mual', english: 'nausea', specialty: ['gastroenterology'], disease: ['胃腸炎', '膵炎'], term: ['吐き気'] },
  { label: '下痢', kana: 'げり', indonesian: 'diare', english: 'diarrhea', specialty: ['gastroenterology', 'infectious-disease'], disease: ['胃腸炎', '感染性腸炎'], term: ['下痢'] },
  { label: '頭痛', kana: 'ずつう', indonesian: 'sakit kepala', english: 'headache', specialty: ['neurology', 'emergency-medicine'], disease: ['片頭痛', '髄膜炎'], term: ['頭痛'] },
  { label: 'めまい', kana: 'めまい', indonesian: 'pusing / vertigo', english: 'dizziness / vertigo', specialty: ['neurology', 'ent'], disease: ['脳梗塞'], term: ['めまい'] },
  { label: 'しびれ', kana: 'しびれ', indonesian: 'kebas', english: 'numbness', specialty: ['neurology'], disease: ['脳梗塞', '末梢神経障害'], term: ['しびれ'] },
  { label: '脱力', kana: 'だつりょく', indonesian: 'kelemahan', english: 'weakness', specialty: ['neurology', 'emergency-medicine'], disease: ['脳梗塞'], term: ['脱力'] },
  { label: '腰痛', kana: 'ようつう', indonesian: 'nyeri pinggang', english: 'low back pain', specialty: ['orthopedics'], disease: ['腰椎椎間板ヘルニア'], term: ['腰痛'] },
  { label: '関節痛', kana: 'かんせつつう', indonesian: 'nyeri sendi', english: 'joint pain', specialty: ['rheumatology', 'orthopedics'], disease: ['関節リウマチ', '痛風'], term: ['関節痛'] },
  { label: '発疹', kana: 'ほっしん', indonesian: 'ruam', english: 'rash', specialty: ['dermatology', 'allergy'], disease: ['蕁麻疹', '帯状疱疹'], term: ['発疹'] },
  { label: '排尿時の痛み', kana: 'はいにょうじのいたみ', indonesian: 'nyeri saat berkemih', english: 'pain with urination', specialty: ['urology'], disease: ['尿路感染症', '膀胱炎'], term: ['排尿痛'] },
  { label: '血尿', kana: 'けつにょう', indonesian: 'kencing berdarah', english: 'blood in urine', specialty: ['urology', 'nephrology'], disease: ['尿路結石', '腎炎'], term: ['血尿'] },
  { label: '不正出血', kana: 'ふせいしゅっけつ', indonesian: 'perdarahan tidak teratur', english: 'abnormal bleeding', specialty: ['obgyn'], disease: ['子宮筋腫', '子宮外妊娠'], term: ['不正出血'] },
  { label: '飲み込みにくさ', kana: 'のみこみにくさ', indonesian: 'sulit menelan', english: 'difficulty swallowing', specialty: ['ent', 'gastroenterology', 'rehabilitation'], disease: ['誤嚥性肺炎'], term: ['嚥下障害'] },
  { label: 'かゆみ', kana: 'かゆみ', indonesian: 'gatal', english: 'itching', specialty: ['dermatology', 'allergy'], disease: ['アトピー性皮膚炎', '蕁麻疹'], term: ['掻痒感'] },
];

function ask(complaint: Complaint, intent: string, suffix: string, suffixKana: string, english: string, indonesian: string, note: string): PhraseRow {
  return {
    intent: `${complaint.label} · ${intent}`,
    ja: `${complaint.label}${suffix}`,
    kana: `${complaint.kana}${suffixKana}`,
    en: english,
    idn: indonesian,
    reg: 'polite',
    speaker: 'doctor',
    stage: 'hpi',
    context: `History-taking for ${complaint.english}`,
    nuance: note,
    spec: complaint.specialty,
    rel: complaint.term,
    diseases: complaint.disease,
    priority: 'essential',
  };
}

function answer(complaint: Complaint, japanese: string, kana: string, indonesian: string, english: string, note: string): PhraseRow {
  return {
    intent: `${complaint.label} · patient answer`,
    ja: japanese,
    kana,
    en: english,
    idn: indonesian,
    reg: 'patient-friendly',
    speaker: 'patient',
    stage: 'hpi',
    context: `Natural patient wording for ${complaint.english}`,
    nuance: note,
    spec: complaint.specialty,
    rel: complaint.term,
    diseases: complaint.disease,
    priority: 'common',
  };
}

export const PHRASES_SCENARIO_EXPANSION: ClinicalPhrase[] = complaints.flatMap((complaint) => [
  P(ask(complaint, 'onset', 'はいつからですか。', 'はいつからですか。', `When did the ${complaint.english} start?`, `${complaint.indonesian} mulai sejak kapan?`, 'Use for the first time point in the HPI.')),
  P(ask(complaint, 'duration', 'は一回どのくらい続きますか。', 'はいっかいどのくらいつづきますか。', `How long does each episode of ${complaint.english} last?`, `Setiap episode ${complaint.indonesian} berlangsung berapa lama?`, 'Distinguishes brief episodes from persistent symptoms.')),
  P(ask(complaint, 'location', 'はどの場所が一番つらいですか。', 'はどのばしょがいちばんつらいですか。', `Where is the ${complaint.english} worst?`, `Di bagian mana ${complaint.indonesian} paling berat?`, '「つらい」is patient-friendly and less technical than asking for an anatomical label.')),
  P(ask(complaint, 'quality', 'はどのような感じですか。', 'はどのようなかんじですか。', `What does the ${complaint.english} feel like?`, `Rasanya seperti apa?`, 'Invite a patient description before offering descriptors.')),
  P(ask(complaint, 'severity', 'は10段階でどのくらいですか。', 'はじゅっだんかいでどのくらいですか。', `How severe is the ${complaint} on a scale of ten?`, `Seberapa berat ${complaint.indonesian} dalam skala sepuluh?`, 'A natural pain/severity scale question; adapt when the symptom is not pain.')),
  P(ask(complaint, 'radiation', 'はほかの場所に広がりますか。', 'はほかのばしょにひろがりますか。', `Does it spread anywhere else?`, `Apakah menyebar ke bagian lain?`, 'Especially important for chest, abdominal and back pain.')),
  P(ask(complaint, 'aggravating factors', 'は何をすると悪化しますか。', 'はなにをするとあっかしますか。', `What makes it worse?`, `Apa yang membuatnya memburuk?`, 'Ask about exertion, meals, position, movement and triggers.')),
  P(ask(complaint, 'relieving factors', 'は何をすると楽になりますか。', 'はなにをするとらくになりますか。', `What makes it better?`, `Apa yang membuatnya membaik?`, 'Ask about rest, medication, position and bowel movements.')),
  P(ask(complaint, 'associated symptoms', '以外に、気になる症状はありますか。', 'いがいに、きになるしょうじょうはありますか。', `Do you have any other symptoms besides the ${complaint.english}?`, `Apakah ada gejala lain selain ${complaint.indonesian}?`, 'Use before narrowing to a system review.')),
  P(ask(complaint, 'previous episodes', 'は以前にもありましたか。', 'はいぜんにもありましたか。', `Have you had this ${complaint.english} before?`, `Apakah pernah mengalami ${complaint.indonesian} sebelumnya?`, 'Clarifies recurrence and baseline pattern.')),
  P(ask(complaint, 'red flags', 'で、意識が遠のいたり、息ができないほど苦しくなったりしましたか。', 'で、いしきがとおのいたり、いきができないほどくるしくなったりしましたか。', 'Did you faint or become unable to breathe because of it?', 'Apakah sampai hampir pingsan atau tidak bisa bernapas?', 'Use when screening immediate danger; do not treat a negative answer as a complete safety assessment.')),
  P(answer(complaint, `昨日から${complaint.label}があります。`, `きのうから${complaint.kana}があります。`, `Saya mengalami ${complaint.indonesian} sejak kemarin.`, `I have had ${complaint.english} since yesterday.`, 'Common patient time-and-symptom sentence.')),
  P(answer(complaint, `動くと${complaint.label}が強くなります。`, `うごくと${complaint.kana}がつよくなります。`, `${complaint.indonesian} memburuk saat bergerak.`, `The ${complaint.english} gets worse when I move.`, 'Patients often use 「動くと」to link a trigger and symptom.')),
  P(answer(complaint, `横になると${complaint.label}がつらくなります。`, `よこになると${complaint.kana}がつらくなります。`, `${complaint.indonesian} memburuk saat berbaring.`, `The ${complaint.english} gets worse when I lie down.`, 'Important for dyspnea, reflux and some pain patterns.')),
  P(answer(complaint, `薬を飲んでも${complaint.label}が続いています。`, `くすりをのんでも${complaint.kana}がつづいています。`, `${complaint.indonesian} tetap berlanjut meski sudah minum obat.`, `The ${complaint.english} continues despite taking medicine.`, 'Ask which medicine, dose and timing rather than assuming treatment failure.')),
]);

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
