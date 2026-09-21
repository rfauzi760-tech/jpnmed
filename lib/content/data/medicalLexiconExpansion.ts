import { T, type TermRow } from '../builders';
import type { MedicalTerm } from '../schema';

type Seed = Omit<TermRow, 'ex'> & { sentence?: string; sentenceKana?: string; sentenceIdn?: string; sentenceEn?: string };

function term(seed: Seed): MedicalTerm {
  const sentence = seed.sentence ?? `${seed.ja}を確認します。`;
  const reading = { kana: seed.sentenceKana ?? `${seed.kana}をかくにんします。` };
  return T({
    ...seed,
    ex: {
      japanese: sentence,
      kana: reading.kana,
      indonesian: seed.sentenceIdn ?? `Kami akan memeriksa ${seed.idn}.`,
      english: seed.sentenceEn ?? `We will check ${seed.en}.`,
    },
  });
}

const anatomy: Seed[] = [
  { ja: '虫垂', kana: 'ちゅうすい', en: 'vermiform appendix', idn: 'apendiks', cat: 'anatomy', sp: ['gastroenterology', 'surgery'], defJa: '盲腸の先につながる細い袋状の器官です。', usage: '虫垂炎では「盲腸」と患者が言うことがあります。', rel: ['虫垂炎', '腹痛'] },
  { ja: '腎盂', kana: 'じんう', en: 'renal pelvis', idn: 'pelvis renalis', cat: 'anatomy', sp: ['nephrology', 'urology'], defJa: '腎臓で作られた尿が集まり、尿管へ流れる部分です。', rel: ['腎臓', '腎盂腎炎', '尿管'] },
  { ja: '尿管', kana: 'にょうかん', en: 'ureter', idn: 'ureter', cat: 'anatomy', sp: ['urology', 'nephrology'], defJa: '腎臓から膀胱へ尿を運ぶ管です。', rel: ['腎盂', '膀胱', '尿路結石'] },
  { ja: '前立腺', kana: 'ぜんりつせん', en: 'prostate', idn: 'prostat', cat: 'anatomy', sp: ['urology'], defJa: '男性の膀胱の下にあり、尿道を囲む器官です。', rel: ['前立腺肥大症', '前立腺炎'] },
  { ja: '胆管', kana: 'たんかん', en: 'bile duct', idn: 'saluran empedu', cat: 'anatomy', sp: ['gastroenterology'], defJa: '肝臓や胆嚢から十二指腸へ胆汁を運ぶ管です。', rel: ['胆嚢', '胆管炎', '黄疸'] },
  { ja: '小腸', kana: 'しょうちょう', en: 'small intestine', idn: 'usus halus', cat: 'anatomy', sp: ['gastroenterology'], defJa: '胃から続き、栄養を吸収する長い消化管です。', rel: ['腸', 'クローン病', '腸閉塞'] },
  { ja: '大腸', kana: 'だいちょう', en: 'large intestine; colon', idn: 'usus besar', cat: 'anatomy', sp: ['gastroenterology', 'surgery'], defJa: '小腸から続き、水分を吸収して便を作る消化管です。', rel: ['大腸がん', '潰瘍性大腸炎', '腸閉塞'] },
  { ja: '直腸', kana: 'ちょくちょう', en: 'rectum', idn: 'rektum', cat: 'anatomy', sp: ['gastroenterology', 'surgery'], defJa: '大腸の最後の部分で、肛門の手前にあります。', rel: ['大腸', '血便'] },
  { ja: '肛門', kana: 'こうもん', en: 'anus', idn: 'anus', cat: 'anatomy', sp: ['gastroenterology', 'surgery'], defJa: '消化管の出口です。', rel: ['直腸', '痔'] },
  { ja: '卵巣', kana: 'らんそう', en: 'ovary', idn: 'ovarium', cat: 'anatomy', sp: ['obgyn'], defJa: '卵子と女性ホルモンを作る生殖器官です。', rel: ['卵巣嚢腫', '子宮外妊娠'] },
  { ja: '卵管', kana: 'らんかん', en: 'fallopian tube', idn: 'tuba falopi', cat: 'anatomy', sp: ['obgyn'], defJa: '卵巣から子宮へ卵子を運ぶ管です。', rel: ['子宮外妊娠', '卵巣'] },
  { ja: '子宮', kana: 'しきゅう', en: 'uterus', idn: 'rahim', cat: 'anatomy', sp: ['obgyn'], defJa: '妊娠中に胎児が育つ器官です。', rel: ['子宮筋腫', '子宮内膜症', '不正出血'] },
  { ja: '乳腺', kana: 'にゅうせん', en: 'mammary gland', idn: 'kelenjar payudara', cat: 'anatomy', sp: ['breast-surgery', 'obgyn'], defJa: '母乳を作る乳房の組織です。', rel: ['乳がん', '乳房'] },
  { ja: '膵管', kana: 'すいかん', en: 'pancreatic duct', idn: 'duktus pankreatikus', cat: 'anatomy', sp: ['gastroenterology'], defJa: '膵液を十二指腸へ運ぶ管です。', rel: ['膵炎', '膵臓'] },
  { ja: '食道裂孔', kana: 'しょくどうれっこう', en: 'oesophageal hiatus', idn: 'hiatus esofagus', cat: 'anatomy', sp: ['gastroenterology', 'surgery'], defJa: '横隔膜にある、食道が通る穴です。', rel: ['食道', '胃食道逆流症'] },
  { ja: '横隔膜', kana: 'おうかくまく', en: 'diaphragm', idn: 'diafragma', cat: 'anatomy', sp: ['pulmonology', 'surgery'], defJa: '胸部と腹部を分け、呼吸に使う筋肉です。', rel: ['肺', '呼吸困難'] },
  { ja: '髄膜', kana: 'ずいまく', en: 'meninges', idn: 'meningen', cat: 'anatomy', sp: ['neurology', 'neurosurgery'], defJa: '脳と脊髄を包んで保護する膜です。', rel: ['髄膜炎', '腰椎穿刺'] },
  { ja: '皮下組織', kana: 'ひかそしき', en: 'subcutaneous tissue', idn: 'jaringan subkutan', cat: 'anatomy', sp: ['dermatology', 'surgery'], defJa: '皮膚の下にある脂肪などの組織です。', rel: ['皮膚', '蜂窩織炎'] },
];

const signsAndExam: Seed[] = [
  { ja: '片麻痺', kana: 'へんまひ', en: 'hemiparesis; hemiplegia', idn: 'kelemahan atau kelumpuhan satu sisi', cat: 'sign', sp: ['neurology', 'emergency-medicine'], defJa: '体の左右どちらか一方の手足や顔が弱くなる状態です。', usage: '突然なら脳卒中を疑う重要な表現です。', rel: ['脳梗塞', '脳出血', '脱力'] },
  { ja: '項部硬直', kana: 'こうぶこうちょく', en: 'neck stiffness', idn: 'kaku kuduk', cat: 'sign', sp: ['neurology', 'infectious-disease'], defJa: '首を前に曲げにくくなる診察所見です。', rel: ['髄膜炎', '頭痛'] },
  { ja: '眼振', kana: 'がんしん', en: 'nystagmus', idn: 'nistagmus', cat: 'sign', sp: ['neurology', 'ent'], defJa: '眼球が意思とは無関係に周期的に動く所見です。', rel: ['めまい', '神経学的診察'] },
  { ja: '圧痕性浮腫', kana: 'あっこんせいふしゅ', en: 'pitting edema', idn: 'edema pitting', cat: 'sign', sp: ['cardiology', 'nephrology'], defJa: '皮膚を押した跡がしばらく残るむくみです。', rel: ['浮腫', '心不全', '慢性腎臓病'] },
  { ja: '頸静脈怒張', kana: 'けいじょうみゃくどちょう', en: 'jugular venous distension', idn: 'distensi vena jugularis', cat: 'sign', sp: ['cardiology'], defJa: '首の静脈が目立って張る診察所見です。', rel: ['心不全', '循環器内科'] },
  { ja: '心尖拍動', kana: 'しんせんはくどう', en: 'apical impulse', idn: 'iktus kordis', cat: 'sign', sp: ['cardiology'], defJa: '胸壁から触れる心臓の先端部の拍動です。', rel: ['心臓', '触診'] },
  { ja: '腹膜刺激症状', kana: 'ふくまくしげきしょうじょう', en: 'peritoneal irritation signs', idn: 'tanda iritasi peritoneum', cat: 'sign', sp: ['surgery', 'emergency-medicine'], defJa: '腹膜の炎症により、押して離すと痛むなどの所見です。', rel: ['虫垂炎', '腸閉塞', '腹痛'] },
  { ja: '反跳痛', kana: 'はんちょうつう', en: 'rebound tenderness', idn: 'nyeri lepas', cat: 'sign', sp: ['surgery', 'emergency-medicine'], defJa: '腹部を押して離したときに強く痛む所見です。', rel: ['腹膜刺激症状', '腹痛'] },
  { ja: '筋力低下', kana: 'きんりょくていか', en: 'reduced muscle strength', idn: 'penurunan kekuatan otot', cat: 'sign', sp: ['neurology', 'rehabilitation'], defJa: '筋肉を動かす力が以前より弱くなった状態です。', rel: ['脱力', '片麻痺', '神経学的診察'] },
  { ja: '感覚障害', kana: 'かんかくしょうがい', en: 'sensory deficit', idn: 'gangguan sensorik', cat: 'sign', sp: ['neurology'], defJa: '触覚、痛覚、温度覚などが正常に感じにくい状態です。', rel: ['しびれ', '脳梗塞'] },
  { ja: '反跳現象', kana: 'はんちょうげんしょう', en: 'rebound phenomenon', idn: 'fenomena rebound', cat: 'sign', sp: ['neurology'], defJa: '力を急に抜いたときの運動調整をみる神経診察所見です。', rel: ['神経学的診察'] },
  { ja: 'バビンスキー反射', kana: 'ばびんすきーはんしゃ', en: 'Babinski sign', idn: 'tanda Babinski', cat: 'sign', sp: ['neurology'], defJa: '足底を刺激したときの母趾の反応をみる神経所見です。', rel: ['脳梗塞', '脊髄'] },
];

const testsAndLabs: Seed[] = [
  { ja: '腹部超音波検査', kana: 'ふくぶちょうおんぱけんさ', en: 'abdominal ultrasound', idn: 'USG abdomen', cat: 'imaging', sp: ['gastroenterology', 'surgery'], defJa: '超音波で肝臓、胆嚢、腎臓などを観察する検査です。', sentence: 'おなかの超音波検査を行います。', sentenceKana: 'おなかのちょうおんぱけんさをおこないます。', sentenceIdn: 'Kami akan melakukan USG perut.', sentenceEn: 'We will perform an abdominal ultrasound.', rel: ['胆石症', '胆嚢炎', '腎臓'] },
  { ja: '頭部CT', kana: 'とうぶしーてぃー', en: 'head CT', idn: 'CT kepala', cat: 'imaging', sp: ['neurology', 'emergency-medicine'], defJa: '頭の中の出血や骨の異常を短時間で確認する画像検査です。', sentence: '頭部CTをすぐに撮ります。', sentenceKana: 'とうぶしーてぃーをすぐにとります。', sentenceIdn: 'Kami akan segera melakukan CT kepala.', sentenceEn: 'We will obtain a head CT immediately.', rel: ['脳出血', '脳梗塞', '頭痛'] },
  { ja: '腹部CT', kana: 'ふくぶしーてぃー', en: 'abdominal CT', idn: 'CT abdomen', cat: 'imaging', sp: ['gastroenterology', 'surgery'], defJa: '腹部の臓器と炎症、出血などを断面画像で確認する検査です。', sentence: '腹部CTで炎症の場所を確認します。', sentenceKana: 'ふくぶしーてぃーでえんしょうのばしょをかくにんします。', sentenceIdn: 'Kami memeriksa lokasi peradangan dengan CT abdomen.', sentenceEn: 'We will locate the inflammation with an abdominal CT.', rel: ['虫垂炎', '膵炎', '腸閉塞'] },
  { ja: '造影MRI', kana: 'ぞうえいえむあい', en: 'contrast-enhanced MRI', idn: 'MRI dengan kontras', cat: 'imaging', sp: ['neurology', 'oncology'], defJa: '造影剤を使って血管や腫瘍などを詳しくみるMRI検査です。', rel: ['MRI検査', '脳腫瘍'] },
  { ja: '胃カメラ', kana: 'いかめら', en: 'gastroscopy; upper endoscopy', idn: 'endoskopi lambung', cat: 'procedure', sp: ['gastroenterology'], defJa: '口から内視鏡を入れて食道、胃、十二指腸を観察する検査です。', usage: '患者は「胃カメラ」と言うことが多く、正式には上部消化管内視鏡検査です。', rel: ['上部消化管内視鏡検査', '胃潰瘍'] },
  { ja: '大腸カメラ', kana: 'だいちょうかめら', en: 'colonoscopy', idn: 'kolonoskopi', cat: 'procedure', sp: ['gastroenterology'], defJa: '肛門から内視鏡を入れて大腸を観察する検査です。', usage: '患者向けの自然な呼び方です。', rel: ['大腸内視鏡検査', '大腸がん'] },
  { ja: '心臓カテーテル検査', kana: 'しんぞうかてーてるけんさ', en: 'cardiac catheterization', idn: 'kateterisasi jantung', cat: 'procedure', sp: ['cardiology'], defJa: 'カテーテルを血管から心臓へ進め、冠動脈や心臓の圧を調べる検査です。', rel: ['心筋梗塞', '狭心症', '冠動脈'] },
  { ja: '脳波検査', kana: 'のうはけんさ', en: 'electroencephalography (EEG)', idn: 'pemeriksaan EEG', cat: 'test', sp: ['neurology'], defJa: '頭皮に電極をつけ、脳の電気活動を記録する検査です。', sentence: '脳波検査のために電極をつけます。', sentenceKana: 'のうはけんさのためにでんきょくをつけます。', sentenceIdn: 'Kami memasang elektroda untuk pemeriksaan EEG.', sentenceEn: 'We will place electrodes for an EEG.', rel: ['てんかん'] },
  { ja: '嚥下内視鏡検査', kana: 'えんげないしきょうけんさ', en: 'fiberoptic endoscopic evaluation of swallowing', idn: 'evaluasi menelan dengan endoskopi', cat: 'test', sp: ['rehabilitation', 'ent'], defJa: '鼻から細い内視鏡を入れて、飲み込みの様子を確認する検査です。', rel: ['嚥下障害', '誤嚥性肺炎'] },
  { ja: '呼気一酸化窒素検査', kana: 'こきいっさんかちっそけんさ', en: 'fractional exhaled nitric oxide test', idn: 'tes nitric oxide ekshalasi', cat: 'test', sp: ['pulmonology'], defJa: '吐く息に含まれる一酸化窒素を測り、気道炎症の参考にする検査です。', rel: ['喘息', '呼吸機能検査'] },
  { ja: '動脈血液ガス', kana: 'どうみゃくけつえきがす', en: 'arterial blood gas', idn: 'analisis gas darah arteri', cat: 'lab', sp: ['emergency-medicine', 'icu'], defJa: '動脈の血液から酸素、二酸化炭素、酸塩基平衡を調べます。', sentence: '呼吸の状態を見るために動脈血液ガスを調べます。', sentenceKana: 'こきゅうのじょうたいをみるためにどうみゃくけつえきがすをしらべます。', sentenceIdn: 'Kami memeriksa gas darah arteri untuk menilai pernapasan.', sentenceEn: 'We will check an arterial blood gas to assess breathing.', rel: ['呼吸不全', '酸素飽和度'] },
  { ja: '乳酸値', kana: 'にゅうさんち', en: 'lactate level', idn: 'kadar laktat', cat: 'lab', sp: ['emergency-medicine', 'icu'], defJa: '組織への血流不足や代謝の状態をみる血液検査の項目です。', rel: ['敗血症', 'ショック'] },
  { ja: 'プロカルシトニン', kana: 'ぷろかるしとにん', en: 'procalcitonin', idn: 'prokalsitonin', cat: 'lab', sp: ['infectious-disease'], defJa: '細菌感染の重症度を判断する参考になる血液検査項目です。', rel: ['敗血症', '肺炎'] },
  { ja: '血液型検査', kana: 'けつえきがたけんさ', en: 'blood typing', idn: 'pemeriksaan golongan darah', cat: 'lab', sp: ['emergency-medicine', 'hematology'], defJa: '輸血などのために血液型を確認する検査です。', rel: ['輸血', '血液検査'] },
  { ja: '交差適合試験', kana: 'こうさてきごうしけん', en: 'crossmatch testing', idn: 'uji silang transfusi', cat: 'lab', sp: ['hematology', 'emergency-medicine'], defJa: '輸血する血液と患者の血液が適合するか確認する検査です。', rel: ['輸血', '血液型検査'] },
  { ja: '血液凝固検査', kana: 'けつえきぎょうこけんさ', en: 'coagulation testing', idn: 'pemeriksaan koagulasi', cat: 'lab', sp: ['hematology', 'emergency-medicine'], defJa: '血液が固まる仕組みと出血リスクを調べる検査です。', rel: ['プロトロンビン時間', '活性化部分トロンボプラスチン時間'] },
  { ja: 'アルブミン', kana: 'あるぶみん', en: 'albumin', idn: 'albumin', cat: 'lab', sp: ['hepatology', 'nephrology'], defJa: '肝臓で作られ、血管内の水分を保つ働きがある蛋白です。', rel: ['肝硬変', '腹水'] },
  { ja: 'ビリルビン', kana: 'びりるびん', en: 'bilirubin', idn: 'bilirubin', cat: 'lab', sp: ['hepatology', 'gastroenterology'], defJa: '赤血球の分解で生じ、肝臓や胆道の状態をみる項目です。', rel: ['黄疸', '肝機能検査'] },
  { ja: 'リパーゼ', kana: 'りぱーぜ', en: 'lipase', idn: 'lipase', cat: 'lab', sp: ['gastroenterology'], defJa: '膵臓から分泌される脂肪分解酵素で、膵炎の評価に使います。', rel: ['膵炎', '膵臓'] },
  { ja: 'BNP', kana: 'びーえぬぴー', en: 'B-type natriuretic peptide', idn: 'BNP', cat: 'lab', sp: ['cardiology'], defJa: '心臓に負担がかかったときに増える血液検査項目です。', rel: ['心不全', '心臓'] },
  { ja: 'トロポニンI', kana: 'とろぽにんあい', en: 'troponin I', idn: 'troponin I', cat: 'lab', sp: ['cardiology', 'emergency-medicine'], defJa: '心筋が傷ついたときに血液中で増える蛋白です。', rel: ['心筋梗塞', '胸痛'] },
  { ja: 'フェリチン', kana: 'ふぇりちん', en: 'ferritin', idn: 'ferritin', cat: 'lab', sp: ['hematology'], defJa: '体内に蓄えられた鉄の量を反映する血液検査項目です。', rel: ['鉄欠乏性貧血', '血算'] },
];

const workflow: Seed[] = [
  { ja: '受付', kana: 'うけつけ', en: 'reception; registration desk', idn: 'bagian pendaftaran', cat: 'hospital', sp: ['hospital-administration'], defJa: '患者の来院を確認し、診療手続きを始める窓口です。', sentence: '受付で保険証を提示してください。', sentenceKana: 'うけつけでほけんしょうをていじしてください。', sentenceIdn: 'Silakan tunjukkan kartu asuransi di bagian pendaftaran.', sentenceEn: 'Please show your insurance card at reception.', rel: ['保険証', '問診票'] },
  { ja: '問診票', kana: 'もんしんひょう', en: 'medical questionnaire', idn: 'formulir riwayat kesehatan', cat: 'document', sp: ['hospital-administration'], defJa: '症状や既往歴、薬などを患者が記入する用紙です。', rel: ['問診', '既往歴', '薬剤アレルギー'] },
  { ja: '診察券', kana: 'しんさつけん', en: 'hospital ID card', idn: 'kartu pasien rumah sakit', cat: 'document', sp: ['hospital-administration'], defJa: '病院で患者番号を確認するためのカードです。', rel: ['受付', '予約'] },
  { ja: '身分証明書', kana: 'みぶんしょうめいしょ', en: 'identity document', idn: 'dokumen identitas', cat: 'document', sp: ['hospital-administration'], defJa: '本人確認に使う公的な身分証です。', rel: ['受付', '保険証'] },
  { ja: '入院申込書', kana: 'にゅういんもうしこみしょ', en: 'hospital admission form', idn: 'formulir masuk rumah sakit', cat: 'document', sp: ['hospital-administration'], defJa: '入院に必要な患者情報や連絡先を記入する書類です。', rel: ['入院', '同意書'] },
  { ja: '退院サマリー', kana: 'たいいんさまりー', en: 'discharge summary', idn: 'ringkasan pulang', cat: 'document', sp: ['hospital-administration'], defJa: '入院中の診断、治療、退院後の方針をまとめた文書です。', rel: ['退院', '診療情報提供書'] },
  { ja: '服薬情報提供書', kana: 'ふくやくじょうほうていきょうしょ', en: 'medication information sheet', idn: 'lembar informasi obat', cat: 'document', sp: ['pharmacy', 'hospital-administration'], defJa: '患者が使用している薬の情報を医療者間で共有する書類です。', rel: ['お薬手帳', '薬物相互作用'] },
  { ja: '既往歴', kana: 'きおうれき', en: 'past medical history', idn: 'riwayat penyakit dahulu', cat: 'hospital', sp: ['primary-care', 'internal-medicine'], defJa: 'これまでにかかった病気や受けた治療の記録です。', sentence: 'これまでの病気について教えてください。', sentenceKana: 'これまでのびょうきについておしえてください。', sentenceIdn: 'Tolong ceritakan penyakit yang pernah dialami.', sentenceEn: 'Please tell me about illnesses you have had.', rel: ['現病歴', '家族歴'] },
  { ja: '現病歴', kana: 'げんびょうれき', en: 'history of present illness', idn: 'riwayat penyakit sekarang', cat: 'hospital', sp: ['primary-care', 'internal-medicine'], defJa: '今回の症状が始まってから現在までの経過です。', rel: ['主訴', '既往歴'] },
  { ja: '家族歴', kana: 'かぞくれき', en: 'family history', idn: 'riwayat keluarga', cat: 'hospital', sp: ['primary-care', 'genetics'], defJa: '家族に同じ病気や遺伝に関係する病気があるかの情報です。', rel: ['既往歴', '糖尿病'] },
  { ja: '生活歴', kana: 'せいかつれき', en: 'social history', idn: 'riwayat sosial', cat: 'hospital', sp: ['primary-care'], defJa: '喫煙、飲酒、住環境、仕事など生活に関する情報です。', rel: ['喫煙歴', '飲酒歴'] },
  { ja: '喫煙歴', kana: 'きつえんれき', en: 'smoking history', idn: 'riwayat merokok', cat: 'hospital', sp: ['pulmonology', 'primary-care'], defJa: '喫煙の有無、量、期間、禁煙歴を記録した情報です。', rel: ['COPD', '肺がん'] },
  { ja: '飲酒歴', kana: 'いんしゅれき', en: 'alcohol history', idn: 'riwayat konsumsi alkohol', cat: 'hospital', sp: ['hepatology', 'primary-care'], defJa: '飲酒の種類、量、頻度、期間に関する情報です。', rel: ['肝硬変', '膵炎'] },
  { ja: '職業歴', kana: 'しょくぎょうれき', en: 'occupational history', idn: 'riwayat pekerjaan', cat: 'hospital', sp: ['occupational-medicine'], defJa: '職業や職場での粉じん、薬品、騒音などへの曝露歴です。', rel: ['間質性肺炎', '喘息'] },
  { ja: '渡航歴', kana: 'とこうれき', en: 'travel history', idn: 'riwayat perjalanan', cat: 'hospital', sp: ['infectious-disease', 'primary-care'], defJa: '最近訪れた地域や滞在期間に関する情報です。', rel: ['デング熱', 'マラリア', '腸チフス'] },
  { ja: '予防接種歴', kana: 'よぼうせっしゅれき', en: 'vaccination history', idn: 'riwayat vaksinasi', cat: 'hospital', sp: ['pediatrics', 'infectious-disease'], defJa: 'これまでに受けたワクチンの種類と時期の記録です。', rel: ['インフルエンザ', '肺炎'] },
  { ja: '同伴者', kana: 'どうはんしゃ', en: 'accompanying person', idn: 'pendamping pasien', cat: 'hospital', sp: ['hospital-administration'], defJa: '患者と一緒に来院し、情報提供や支援をする人です。', rel: ['家族', '同意書'] },
  { ja: '面会者', kana: 'めんかいしゃ', en: 'visitor', idn: 'pengunjung pasien', cat: 'hospital', sp: ['hospital-administration'], defJa: '入院患者を訪問する人です。', rel: ['病棟', '面会時間'] },
  { ja: '病室', kana: 'びょうしつ', en: 'patient room', idn: 'kamar pasien', cat: 'hospital', sp: ['hospital-administration'], defJa: '入院患者が療養する部屋です。', rel: ['病棟', '入院'] },
  { ja: 'ナースステーション', kana: 'なーすすてーしょん', en: 'nurses’ station', idn: 'ruang perawat', cat: 'hospital', sp: ['nursing'], defJa: '病棟で看護師が記録や連絡を行う場所です。', rel: ['病棟', '看護師'] },
  { ja: '隔離室', kana: 'かくりしつ', en: 'isolation room', idn: 'ruang isolasi', cat: 'hospital', sp: ['infectious-disease', 'nursing'], defJa: '感染対策のため患者を分けて管理する部屋です。', rel: ['感染対策', '結核'] },
  { ja: '処置室', kana: 'しょちしつ', en: 'treatment room', idn: 'ruang tindakan', cat: 'hospital', sp: ['emergency-medicine', 'nursing'], defJa: '採血、創傷処置、注射などを行う部屋です。', rel: ['採血', '創傷処置'] },
];

const medicationAndNursing: Seed[] = [
  { ja: '食前', kana: 'しょくぜん', en: 'before meals', idn: 'sebelum makan', cat: 'dosage-form', sp: ['pharmacy'], defJa: '通常、食事の約30分前を指す服薬タイミングです。', sentence: 'この薬は食前に飲んでください。', sentenceKana: 'このくすりはしょくぜんにのんでください。', sentenceIdn: 'Minumlah obat ini sebelum makan.', sentenceEn: 'Take this medicine before meals.', rel: ['食後', '服用'] },
  { ja: '食後', kana: 'しょくご', en: 'after meals', idn: 'setelah makan', cat: 'dosage-form', sp: ['pharmacy'], defJa: '食事の後に服用する指示です。', sentence: '朝食後に一錠飲んでください。', sentenceKana: 'ちょうしょくごにいちじょうのんでください。', sentenceIdn: 'Minumlah satu tablet setelah sarapan.', sentenceEn: 'Take one tablet after breakfast.', rel: ['食前', '錠剤'] },
  { ja: '眠前', kana: 'みんぜん', en: 'at bedtime', idn: 'sebelum tidur', cat: 'dosage-form', sp: ['pharmacy'], defJa: '就寝前に服用する指示です。', sentence: '眠前に一回使用してください。', sentenceKana: 'みんぜんにいっかいしようしてください。', sentenceIdn: 'Gunakan sekali sebelum tidur.', sentenceEn: 'Use it once at bedtime.', rel: ['頓服薬', '内服'] },
  { ja: '用法・用量', kana: 'ようほうようりょう', en: 'directions and dosage', idn: 'cara dan dosis pemakaian', cat: 'dosage-form', sp: ['pharmacy'], defJa: '薬をどのように、どの量で使うかを示す情報です。', sentence: '用法・用量を守って使用してください。', sentenceKana: 'ようほうようりょうをまもってしようしてください。', sentenceIdn: 'Gunakan sesuai cara dan dosis yang ditentukan.', sentenceEn: 'Follow the directions and dosage.', rel: ['処方箋', '服用'] },
  { ja: '服用', kana: 'ふくよう', en: 'taking oral medicine', idn: 'minum obat', cat: 'dosage-form', sp: ['pharmacy'], defJa: '錠剤やカプセルなどの薬を口から飲むことです。', rel: ['内服', '錠剤'] },
  { ja: '内服', kana: 'ないふく', en: 'oral administration', idn: 'pemberian oral', cat: 'dosage-form', sp: ['pharmacy', 'nursing'], defJa: '薬を口から使用することを、医療者が記録するときの表現です。', usage: '患者への説明では「飲む」を使うと自然です。', rel: ['服用', '内服薬'] },
  { ja: '頓用', kana: 'とんよう', en: 'as-needed use', idn: 'pemakaian bila perlu', cat: 'dosage-form', sp: ['pharmacy'], defJa: '症状があるときに指示された範囲で使うことです。', sentence: '痛みがあるときだけ頓用してください。', sentenceKana: 'いたみがあるときだけとんようしてください。', sentenceIdn: 'Gunakan hanya bila nyeri muncul, sesuai petunjuk.', sentenceEn: 'Use it as needed for pain, within the instructions.', rel: ['頓服薬', '痛み止め'] },
  { ja: '点滴静注', kana: 'てんてきじょうちゅう', en: 'intravenous infusion', idn: 'infus intravena', cat: 'procedure', sp: ['nursing', 'emergency-medicine'], defJa: '薬液や輸液を静脈から時間をかけて投与する方法です。', rel: ['点滴', '静脈注射'] },
  { ja: '皮下注射', kana: 'ひかちゅうしゃ', en: 'subcutaneous injection', idn: 'suntikan subkutan', cat: 'procedure', sp: ['nursing', 'endocrinology'], defJa: '皮膚の下の組織へ薬を注射する方法です。', rel: ['インスリン製剤', '注射'] },
  { ja: '吸入', kana: 'きゅうにゅう', en: 'inhalation', idn: 'inhalasi', cat: 'procedure', sp: ['pulmonology', 'nursing'], defJa: '薬や酸素を口または鼻から吸い込むことです。', sentence: '吸入後は口をすすいでください。', sentenceKana: 'きゅうにゅうごはくちをすすいでください。', sentenceIdn: 'Setelah inhalasi, berkumurlah.', sentenceEn: 'Rinse your mouth after inhalation.', rel: ['吸入薬', '喘息'] },
  { ja: '後発医薬品', kana: 'こうはついやくひん', en: 'generic medicine', idn: 'obat generik', cat: 'medication', sp: ['pharmacy'], defJa: '先発医薬品の特許期間後に同じ有効成分で作られる薬です。', usage: '患者には「ジェネリック」と説明されることもあります。', rel: ['先発医薬品', '薬局'] },
  { ja: '先発医薬品', kana: 'せんぱついやくひん', en: 'brand-name medicine', idn: 'obat bermerek originator', cat: 'medication', sp: ['pharmacy'], defJa: '新しい有効成分を最初に開発して販売する薬です。', rel: ['後発医薬品', '処方箋'] },
  { ja: '薬剤師', kana: 'やくざいし', en: 'pharmacist', idn: 'apoteker', cat: 'hospital', sp: ['pharmacy'], defJa: '薬の調剤、確認、説明を専門に行う医療職です。', sentence: '薬の飲み方は薬剤師にも確認できます。', sentenceKana: 'くすりののみかたはやくざいしにもかくにんできます。', sentenceIdn: 'Cara minum obat juga dapat dikonfirmasi kepada apoteker.', sentenceEn: 'The pharmacist can also confirm how to take the medicine.', rel: ['薬局', '処方箋'] },
  { ja: '服薬アドヒアランス', kana: 'ふくやくあどひあらんす', en: 'medication adherence', idn: 'kepatuhan penggunaan obat', cat: 'hospital', sp: ['pharmacy', 'primary-care'], defJa: '患者が治療方針を理解し、自分の意思で薬を続けている程度です。', rel: ['アドヒアランス', '服用'] },
  { ja: '飲み忘れ', kana: 'のみわすれ', en: 'missed dose', idn: 'lupa minum obat', cat: 'hospital', sp: ['pharmacy'], defJa: '決められた薬を飲むのを忘れることです。', sentence: '飲み忘れたときの対応を説明します。', sentenceKana: 'のみわすれたときのたいおうをせつめいします。', sentenceIdn: 'Kami akan menjelaskan apa yang dilakukan jika lupa minum obat.', sentenceEn: 'I will explain what to do if you miss a dose.', rel: ['服薬アドヒアランス', '処方箋'] },
  { ja: '薬歴', kana: 'やくれき', en: 'medication record', idn: 'riwayat obat', cat: 'document', sp: ['pharmacy'], defJa: '現在または過去に使った薬の記録です。', rel: ['お薬手帳', '薬物相互作用'] },
  { ja: '相互作用', kana: 'そうごさよう', en: 'drug interaction', idn: 'interaksi obat', cat: 'medication', sp: ['pharmacy'], defJa: '薬や食品の組み合わせによって、薬の作用が変化することです。', rel: ['薬物相互作用', '薬歴'] },
];

const emergencyAndCare: Seed[] = [
  { ja: '気道確保', kana: 'きどうかくほ', en: 'airway management', idn: 'manajemen jalan napas', cat: 'emergency', sp: ['emergency-medicine', 'icu'], defJa: '空気が肺へ通る道を開けて保つ処置です。', sentence: 'まず気道確保と酸素投与を行います。', sentenceKana: 'まずきどうかくほとさんそとうよをおこないます。', sentenceIdn: 'Pertama kami akan mengamankan jalan napas dan memberikan oksigen.', sentenceEn: 'First we will secure the airway and give oxygen.', rel: ['気管挿管', '酸素投与'] },
  { ja: '胸骨圧迫', kana: 'きょうこつあっぱく', en: 'chest compressions', idn: 'kompresi dada', cat: 'emergency', sp: ['emergency-medicine', 'icu'], defJa: '心停止時に胸骨を押して血液を循環させる処置です。', rel: ['心肺蘇生', '除細動器'] },
  { ja: '自動体外式除細動器', kana: 'じどうたいがいしきじょさいどうき', en: 'automated external defibrillator (AED)', idn: 'AED', cat: 'medical-device', sp: ['emergency-medicine'], defJa: '心停止時に心電図を解析し、必要なら電気ショックを行う機器です。', usage: '略してAED（エーイーディー）と呼びます。', rel: ['心肺蘇生', '除細動器'] },
  { ja: '非侵襲的陽圧換気', kana: 'ひしんしゅうてきようあつかんき', en: 'non-invasive positive-pressure ventilation', idn: 'ventilasi tekanan positif noninvasif', cat: 'procedure', sp: ['pulmonology', 'icu'], defJa: '気管挿管をせず、マスクで圧力をかけて呼吸を助ける方法です。', rel: ['呼吸不全', '人工呼吸器'] },
  { ja: '気管切開', kana: 'きかんせっかい', en: 'tracheostomy', idn: 'trakeostomi', cat: 'surgery', sp: ['ent', 'icu'], defJa: '首の前から気管へ通り道を作る手術です。', rel: ['気管挿管', '人工呼吸器'] },
  { ja: '中心静脈栄養', kana: 'ちゅうしんじょうみゃくえいよう', en: 'parenteral nutrition', idn: 'nutrisi parenteral', cat: 'procedure', sp: ['nutrition', 'icu'], defJa: '中心静脈から栄養を投与する方法です。', rel: ['中心静脈カテーテル', '栄養科'] },
  { ja: '輸液', kana: 'ゆえき', en: 'fluid therapy; IV fluids', idn: 'terapi cairan infus', cat: 'procedure', sp: ['emergency-medicine', 'nursing'], defJa: '水分や電解質などの液体を体内へ補う治療です。', rel: ['点滴', '脱水', 'ショック'] },
  { ja: '感染対策', kana: 'かんせんたいさく', en: 'infection control', idn: 'pencegahan dan pengendalian infeksi', cat: 'hospital', sp: ['infectious-disease', 'nursing'], defJa: '感染の拡大を防ぐための手洗い、隔離、防護具などの対策です。', sentence: '感染対策のため、マスクを着用してください。', sentenceKana: 'かんせんたいさくのため、ますくをちゃくようしてください。', sentenceIdn: 'Untuk pencegahan infeksi, silakan memakai masker.', sentenceEn: 'Please wear a mask for infection control.', rel: ['隔離室', '結核'] },
  { ja: '標準予防策', kana: 'ひょうじゅんよぼうさく', en: 'standard precautions', idn: 'kewaspadaan standar', cat: 'hospital', sp: ['infectious-disease', 'nursing'], defJa: 'すべての患者の血液や体液を感染性として扱う基本的な対策です。', rel: ['感染対策', '手袋'] },
  { ja: '転倒予防', kana: 'てんとうよぼう', en: 'fall prevention', idn: 'pencegahan jatuh', cat: 'hospital', sp: ['nursing', 'rehabilitation'], defJa: '入院中や高齢者の転倒を防ぐための環境と介助の工夫です。', sentence: '一人で歩かず、ナースコールを押してください。', sentenceKana: 'ひとりであるかず、なーすこーるをおしてください。', sentenceIdn: 'Jangan berjalan sendiri; tekan bel perawat.', sentenceEn: 'Do not walk alone; press the nurse call button.', rel: ['歩行障害', 'ナースコール'] },
  { ja: '褥瘡', kana: 'じょくそう', en: 'pressure injury; pressure ulcer', idn: 'luka tekan', cat: 'sign', sp: ['nursing', 'rehabilitation'], defJa: '同じ姿勢で圧迫され続けた皮膚や組織の傷です。', rel: ['体位変換', '創傷処置'] },
  { ja: '体位変換', kana: 'たいいへんかん', en: 'repositioning', idn: 'perubahan posisi tubuh', cat: 'procedure', sp: ['nursing', 'rehabilitation'], defJa: '寝たきりの患者の姿勢を定期的に変える介助です。', sentence: '褥瘡予防のため、二時間ごとに体位変換します。', sentenceKana: 'じょくそうよぼうのため、にじかんごとにたいいへんかんします。', sentenceIdn: 'Untuk mencegah luka tekan, posisi akan diubah setiap dua jam.', sentenceEn: 'We will reposition you every two hours to prevent pressure injuries.', rel: ['褥瘡', 'リハビリ'] },
  { ja: '退院支援', kana: 'たいいんしえん', en: 'discharge support', idn: 'dukungan persiapan pulang', cat: 'hospital', sp: ['nursing', 'hospital-administration'], defJa: '退院後の生活、薬、通院、介護などを整える支援です。', rel: ['退院', '退院調整', '訪問看護'] },
  { ja: '地域連携室', kana: 'ちいきれんけいしつ', en: 'community liaison office', idn: 'unit koordinasi layanan komunitas', cat: 'hospital', sp: ['hospital-administration'], defJa: '転院、在宅療養、介護サービスなどを調整する部署です。', rel: ['紹介', '退院支援'] },
  { ja: '医療ソーシャルワーカー', kana: 'いりょうそーしゃるわーかー', en: 'medical social worker', idn: 'pekerja sosial medis', cat: 'hospital', sp: ['hospital-administration'], defJa: '療養生活、費用、制度、退院先などの相談を支援する職種です。', rel: ['退院支援', '保険証'] },
  { ja: '通訳', kana: 'つうやく', en: 'interpreter', idn: 'penerjemah lisan', cat: 'hospital', sp: ['hospital-administration'], defJa: '患者と医療者の会話を正確に通訳する人です。', sentence: '必要であれば医療通訳を手配します。', sentenceKana: 'ひつようであればいりょうつうやくをてはいします。', sentenceIdn: 'Jika perlu, kami akan menyiapkan penerjemah medis.', sentenceEn: 'We can arrange a medical interpreter if needed.', rel: ['同意書', '説明'] },
  { ja: 'セカンドオピニオン', kana: 'せかんどおぴにおん', en: 'second opinion', idn: 'pendapat medis kedua', cat: 'hospital', sp: ['hospital-administration'], defJa: '診断や治療について、別の医師の意見を聞くことです。', rel: ['紹介状', '診療情報提供書'] },
];

export const MEDICAL_LEXICON_EXPANSION: MedicalTerm[] = [...anatomy, ...signsAndExam, ...testsAndLabs, ...workflow, ...medicationAndNursing, ...emergencyAndCare].map(term);
