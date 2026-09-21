import { T, type TermRow } from '../builders';
import type { MedicalTerm } from '../schema';

type Seed = Omit<TermRow, 'ex'>;

const row = (seed: Seed): MedicalTerm => T({
  ...seed,
  ex: {
    japanese: `${seed.ja}についてご説明します。`,
    kana: `${seed.kana}についてごせつめいします。`,
    indonesian: `Kami akan menjelaskan tentang ${seed.idn}.`,
    english: `I will explain ${seed.en}.`,
  },
});

const rows: Seed[] = [
  { ja: '脂質異常症', kana: 'ししついじょうしょう', en: 'dyslipidemia', idn: 'dislipidemia', cat: 'disease', sp: ['cardiology', 'internal-medicine'], defJa: '血液中のコレステロールや中性脂肪が基準から外れている状態です。', rel: ['高血圧', '心筋梗塞'] },
  { ja: '不整脈', kana: 'ふせいみゃく', en: 'arrhythmia', idn: 'aritmia', cat: 'disease', sp: ['cardiology'], defJa: '心臓の拍動が速い、遅い、または不規則になる状態です。', rel: ['心房細動', '動悸'] },
  { ja: '呼吸不全', kana: 'こきゅうふぜん', en: 'respiratory failure', idn: 'gagal napas', cat: 'disease', sp: ['pulmonology', 'icu'], defJa: '肺が酸素を取り込んだり二酸化炭素を出したりできない状態です。', rel: ['呼吸困難', '酸素飽和度'] },
  { ja: '肺がん', kana: 'はいがん', en: 'lung cancer', idn: 'kanker paru', cat: 'disease', sp: ['pulmonology', 'oncology'], defJa: '肺の細胞から発生する悪性腫瘍です。', rel: ['喀血', '胸水'] },
  { ja: '慢性咳嗽', kana: 'まんせいがいそう', en: 'chronic cough', idn: 'batuk kronis', cat: 'symptom', sp: ['pulmonology'], defJa: '長期間続く咳で、感染後、喘息、逆流など原因はさまざまです。', rel: ['咳', '胃食道逆流症'] },
  { ja: '肥満', kana: 'ひまん', en: 'obesity', idn: 'obesitas', cat: 'disease', sp: ['endocrinology', 'primary-care'], defJa: '体脂肪が過剰に蓄積した状態です。', rel: ['睡眠時無呼吸症候群', '糖尿病'] },
  { ja: '感染性腸炎', kana: 'かんせんせいちょうえん', en: 'infectious enteritis', idn: 'enteritis infeksius', cat: 'disease', sp: ['gastroenterology', 'infectious-disease'], defJa: '細菌やウイルスなどの感染で腸に炎症が起こる病気です。', rel: ['下痢', '発熱'] },
  { ja: '膀胱炎', kana: 'ぼうこうえん', en: 'cystitis', idn: 'sistitis', cat: 'disease', sp: ['urology'], defJa: '膀胱に細菌などによる炎症が起こる病気です。', rel: ['排尿痛', '尿路感染症'] },
  { ja: '貧血', kana: 'ひんけつ', en: 'anemia', idn: 'anemia', cat: 'disease', sp: ['hematology', 'primary-care'], defJa: '赤血球やヘモグロビンが少なく、酸素を運ぶ力が低下した状態です。', rel: ['倦怠感', '鉄欠乏性貧血'] },
  { ja: '食道炎', kana: 'しょくどうえん', en: 'esophagitis', idn: 'esofagitis', cat: 'disease', sp: ['gastroenterology'], defJa: '食道の粘膜に炎症が起こった状態です。', rel: ['胃食道逆流症', '嚥下痛'] },
  { ja: '炎症性腸疾患', kana: 'えんしょうせいちょうしっかん', en: 'inflammatory bowel disease', idn: 'penyakit radang usus', cat: 'disease', sp: ['gastroenterology'], defJa: '免疫反応などで腸に慢性炎症が起こる病気の総称です。', rel: ['クローン病', '潰瘍性大腸炎'] },
  { ja: '便秘症', kana: 'べんぴしょう', en: 'chronic constipation', idn: 'konstipasi', cat: 'disease', sp: ['gastroenterology', 'primary-care'], defJa: '便が出にくい、硬い、残便感があるなどの状態です。', rel: ['便秘', '腸閉塞'] },
  { ja: '胆管炎', kana: 'たんかんえん', en: 'cholangitis', idn: 'kolangitis', cat: 'disease', sp: ['gastroenterology', 'surgery'], defJa: '胆管に細菌感染と炎症が起こる病気です。', rel: ['黄疸', '胆石症', '敗血症'] },
  { ja: '肝炎', kana: 'かんえん', en: 'hepatitis', idn: 'hepatitis', cat: 'disease', sp: ['hepatology'], defJa: '肝臓に炎症が起こっている状態です。', rel: ['肝硬変', '黄疸'] },
  { ja: 'くも膜下出血', kana: 'くもまくかしゅっけつ', en: 'subarachnoid hemorrhage', idn: 'perdarahan subaraknoid', cat: 'disease', sp: ['neurology', 'neurosurgery'], defJa: '脳を包む膜の下に出血が起こる緊急疾患です。', rel: ['頭痛', '脳出血'] },
  { ja: '脳炎', kana: 'のうえん', en: 'encephalitis', idn: 'ensefalitis', cat: 'disease', sp: ['neurology', 'infectious-disease'], defJa: '脳の組織に炎症が起こる病気です。', rel: ['髄膜炎', '意識障害'] },
  { ja: '顔面神経麻痺', kana: 'がんめんしんけいまひ', en: 'facial nerve palsy', idn: 'kelumpuhan saraf wajah', cat: 'sign', sp: ['neurology', 'ent'], defJa: '顔面神経の障害で、顔の片側を動かしにくくなる状態です。', rel: ['ベル麻痺', '脳梗塞'] },
  { ja: '高コレステロール血症', kana: 'こうこれすてろーるけっしょう', en: 'hypercholesterolemia', idn: 'hiperkolesterolemia', cat: 'disease', sp: ['cardiology', 'endocrinology'], defJa: '血液中のコレステロールが高い状態です。', rel: ['脂質異常症', '動脈硬化'] },
  { ja: '高尿酸血症', kana: 'こうにょうさんけっしょう', en: 'hyperuricemia', idn: 'hiperurisemia', cat: 'disease', sp: ['rheumatology', 'nephrology'], defJa: '血液中の尿酸値が高い状態です。', rel: ['痛風', '尿路結石'] },
  { ja: '腎結石', kana: 'じんけっせき', en: 'kidney stone', idn: 'batu ginjal', cat: 'disease', sp: ['nephrology', 'urology'], defJa: '腎臓内にできた結石です。', rel: ['尿路結石', '血尿'] },
  { ja: '変形性関節症', kana: 'へんけいせいかんせつしょう', en: 'osteoarthritis', idn: 'osteoartritis', cat: 'disease', sp: ['orthopedics'], defJa: '関節の軟骨がすり減り、痛みや動かしにくさが出る病気です。', rel: ['関節痛', '骨粗鬆症'] },
  { ja: '腎炎', kana: 'じんえん', en: 'nephritis', idn: 'nefritis', cat: 'disease', sp: ['nephrology'], defJa: '腎臓の組織に炎症が起こる病気です。', rel: ['慢性腎臓病', '血尿'] },
  { ja: '脊柱管狭窄症', kana: 'せきちゅうかんきょうさくしょう', en: 'spinal stenosis', idn: 'stenosis kanalis spinalis', cat: 'disease', sp: ['orthopedics', 'neurosurgery'], defJa: '脊柱管が狭くなり、神経が圧迫される病気です。', rel: ['腰痛', '歩行障害'] },
  { ja: '硬膜下血腫', kana: 'こうまくかけっしゅ', en: 'subdural hematoma', idn: 'hematoma subdural', cat: 'disease', sp: ['neurosurgery', 'emergency-medicine'], defJa: '硬膜と脳の間に血液がたまる状態です。', rel: ['頭部外傷', '意識障害'] },
  { ja: '外傷', kana: 'がいしょう', en: 'trauma; injury', idn: 'trauma / cedera', cat: 'emergency', sp: ['trauma', 'emergency-medicine'], defJa: '外からの力で体の組織が傷ついた状態です。', rel: ['骨折', '熱傷'] },
  { ja: '感染症', kana: 'かんせんしょう', en: 'infectious disease', idn: 'penyakit infeksi', cat: 'disease', sp: ['infectious-disease'], defJa: '細菌、ウイルス、真菌などが体内で増えて起こる病気です。', rel: ['敗血症', '発熱'] },
  { ja: '接触皮膚炎', kana: 'せっしょくひふえん', en: 'contact dermatitis', idn: 'dermatitis kontak', cat: 'disease', sp: ['dermatology'], defJa: '皮膚に触れた物質によって炎症やかゆみが起こる病気です。', rel: ['発疹', '掻痒感'] },
  { ja: '痔', kana: 'じ', en: 'hemorrhoids', idn: 'wasir', cat: 'disease', sp: ['gastroenterology', 'surgery'], defJa: '肛門周囲の血管や組織が腫れ、痛みや出血を起こす状態です。', rel: ['肛門', '血便'] },
  { ja: '乳房', kana: 'ちぶさ', en: 'breast', idn: 'payudara', cat: 'anatomy', sp: ['breast-surgery', 'obgyn'], defJa: '胸の前面にある乳腺と脂肪などからなる器官です。', rel: ['乳腺', '乳がん'] },
  { ja: '末梢神経障害', kana: 'まっしょうしんけいしょうがい', en: 'peripheral neuropathy', idn: 'neuropati perifer', cat: 'disease', sp: ['neurology', 'endocrinology'], defJa: '手足などの末梢神経が障害され、しびれや痛みが出る状態です。', rel: ['しびれ', '糖尿病'] },
  { ja: '皮膚炎', kana: 'ひふえん', en: 'dermatitis', idn: 'dermatitis', cat: 'disease', sp: ['dermatology'], defJa: '皮膚に炎症が起こり、赤みやかゆみが出る状態です。', rel: ['発疹', '接触皮膚炎'] },
  { ja: '皮膚', kana: 'ひふ', en: 'skin', idn: 'kulit', cat: 'anatomy', sp: ['dermatology'], defJa: '体の表面を覆い、外部から守る器官です。', rel: ['皮下組織', '発疹'] },
  { ja: '脳腫瘍', kana: 'のうしゅよう', en: 'brain tumor', idn: 'tumor otak', cat: 'disease', sp: ['neurosurgery', 'oncology'], defJa: '脳やその周囲にできる腫瘍です。', rel: ['頭痛', '頭部CT'] },
  { ja: '呼吸機能検査', kana: 'こきゅうきのうけんさ', en: 'pulmonary function testing', idn: 'tes fungsi paru', cat: 'test', sp: ['pulmonology'], defJa: '息を吸う・吐く力や肺の容量を測る検査です。', rel: ['喘息', '慢性閉塞性肺疾患'] },
  { ja: '問診', kana: 'もんしん', en: 'medical interview', idn: 'anamnesis', cat: 'hospital', sp: ['primary-care'], defJa: '症状や経過、背景を患者から聞き取る診療行為です。', rel: ['既往歴', '現病歴'] },
  { ja: '主訴', kana: 'しゅそ', en: 'chief complaint', idn: 'keluhan utama', cat: 'hospital', sp: ['primary-care'], defJa: '患者が受診の主な理由として訴える症状や問題です。', rel: ['問診', '現病歴'] },
  { ja: '家族', kana: 'かぞく', en: 'family member', idn: 'keluarga', cat: 'hospital', sp: ['hospital-administration'], defJa: '患者を支援し、病歴や意思決定に関わる近親者です。', rel: ['家族歴', '同伴者'] },
  { ja: '面会時間', kana: 'めんかいじかん', en: 'visiting hours', idn: 'jam berkunjung', cat: 'hospital', sp: ['hospital-administration'], defJa: '入院患者に面会できる時間帯です。', rel: ['面会者', '病棟'] },
  { ja: '看護師', kana: 'かんごし', en: 'nurse', idn: 'perawat', cat: 'hospital', sp: ['nursing'], defJa: '療養上の世話と診療の補助を担う医療職です。', rel: ['ナースステーション', '病棟'] },
  { ja: '内服薬', kana: 'ないふくやく', en: 'oral medication', idn: 'obat oral', cat: 'medication', sp: ['pharmacy'], defJa: '口から飲んで使う薬です。', rel: ['内服', '服用'] },
  { ja: '貼付', kana: 'ちょうふ', en: 'application of a patch', idn: 'pemasangan plester obat', cat: 'procedure', sp: ['pharmacy', 'nursing'], defJa: '薬剤のついた貼付剤を皮膚に貼ることです。', rel: ['貼付剤', '薬剤'] },
  { ja: '薬剤', kana: 'やくざい', en: 'pharmaceutical agent', idn: 'obat / agen farmasi', cat: 'medication', sp: ['pharmacy'], defJa: '治療や予防のために使う薬の成分や製剤です。', rel: ['薬剤師', '副作用'] },
  { ja: '手袋', kana: 'てぶくろ', en: 'gloves', idn: 'sarung tangan', cat: 'medical-device', sp: ['nursing', 'infectious-disease'], defJa: '処置や感染対策で手を保護する防護具です。', rel: ['標準予防策', '感染対策'] },
  { ja: '歩行障害', kana: 'ほこうしょうがい', en: 'gait impairment', idn: 'gangguan berjalan', cat: 'sign', sp: ['neurology', 'rehabilitation'], defJa: '立つ、歩く、方向転換などが難しくなる状態です。', rel: ['歩行障害', '片麻痺'] },
  { ja: 'ナースコール', kana: 'なーすこーる', en: 'nurse call button', idn: 'bel perawat', cat: 'medical-device', sp: ['nursing'], defJa: '患者が看護師を呼ぶためのボタンや装置です。', rel: ['看護師', '転倒予防'] },
  { ja: '訪問看護', kana: 'ほうもんかんご', en: 'home nursing', idn: 'perawatan di rumah', cat: 'hospital', sp: ['nursing', 'rehabilitation'], defJa: '看護師が患者の自宅を訪問して療養を支援するサービスです。', rel: ['退院支援', '地域連携室'] },
  { ja: '説明', kana: 'せつめい', en: 'explanation', idn: 'penjelasan', cat: 'hospital', sp: ['hospital-administration'], defJa: '診断、検査、治療、見通しなどを患者に分かるように伝えることです。', rel: ['同意書', '通訳'] },
  { ja: '甲状腺疾患', kana: 'こうじょうせんしっかん', en: 'thyroid disease', idn: 'penyakit tiroid', cat: 'disease', sp: ['endocrinology'], defJa: '甲状腺のホルモンや構造に関わる病気の総称です。', rel: ['甲状腺', '甲状腺機能亢進症'] },
  { ja: '子癇', kana: 'しかん', en: 'eclampsia', idn: 'eklamsia', cat: 'disease', sp: ['obgyn', 'emergency-medicine'], defJa: '妊娠高血圧症候群に関連してけいれんが起こる緊急状態です。', rel: ['妊娠高血圧症候群', 'けいれん'] },
];

export const MEDICAL_RELATION_SUPPORT: MedicalTerm[] = rows.map(row);
