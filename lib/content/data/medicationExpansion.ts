import { M, type ClinicalLineRow } from '../builders';
import type { Medication, VerificationStatus } from '../schema';

type DrugSeed = {
  id: string;
  idn: string;
  en: string;
  ja: string;
  katakana: string;
  kana: string;
  drugClassJapanese: string;
  dosageForms: string[];
  indicationTerms: string[];
  whyJa: string;
  whyKana: string;
  whyIdn: string;
  whyEn: string;
  aliases?: string[];
  adverse?: ClinicalLineRow[];
  relatedDiseases?: string[];
  relatedClasses?: string[];
  v?: VerificationStatus;
};

const line = (japanese: string, kana: string, indonesian: string, english: string): ClinicalLineRow => ({ japanese, kana, indonesian, english });

function D(seed: DrugSeed): Medication {
  return M({
    id: seed.id,
    indonesianGeneric: seed.idn,
    english: seed.en,
    japanese: seed.ja,
    katakana: seed.katakana,
    kana: seed.kana,
    drugClassJapanese: seed.drugClassJapanese,
    dosageForms: seed.dosageForms,
    indicationTerms: seed.indicationTerms,
    whyPrescribed: line(seed.whyJa, seed.whyKana, seed.whyIdn, seed.whyEn),
    frequencyInstruction: line('処方された回数と間隔を守って飲んでください。', 'しょほうされたかいすうとかんかくをまもってのんでください。', 'Minum sesuai jumlah dan interval yang diresepkan.', 'Take it at the prescribed frequency and interval.'),
    mealInstruction: line('食事との関係は薬袋の指示を確認してください。', 'しょくじとのかんけいはくすりぶくろのしじをかくにんしてください。', 'Ikuti petunjuk pada label mengenai hubungan dengan makan.', 'Check the label for instructions about meals.'),
    prnInstruction: line('症状がないときに追加で飲む薬ではありません。', 'しょうじょうがないときについかでのむくすりではありません。', 'Jangan menambah obat ini saat tidak ada gejala.', 'Do not take extra doses when you have no symptoms.'),
    durationInstruction: line('自己判断で中止や増量をせず、次回の診察で相談してください。', 'じこはんだんでちゅうしやぞうりょうをせず、じかいのしんさつでそうだんしてください。', 'Jangan menghentikan atau menaikkan dosis sendiri; konsultasikan saat kontrol berikutnya.', 'Do not stop or increase it on your own; discuss it at follow-up.'),
    adverseEffectVocabulary: seed.adverse ?? [],
    allergyQuestion: line('この薬や同じ種類の薬で発疹や息苦しさが出たことはありますか。', 'このくすりやおなじしゅるいのくすりでほっしんやいきぐるしさがでたことはありますか。', 'Pernah ruam atau sesak setelah obat ini atau obat sejenis?', 'Have you had a rash or breathing difficulty with this or a similar medicine?'),
    reconciliationQuestions: [line('市販薬、サプリメント、他の病院の薬も飲んでいますか。', 'しはんやく、さぷりめんと、ほかのびょういんのくすりものんでいますか。', 'Apakah Anda juga minum obat bebas, suplemen, atau obat dari rumah sakit lain?', 'Do you also take over-the-counter medicines, supplements, or medicines from another hospital?')],
    aliases: seed.aliases ?? [],
    relatedDiseases: seed.relatedDiseases ?? [],
    relatedClasses: seed.relatedClasses ?? [seed.drugClassJapanese],
    verificationStatus: seed.v ?? 'draft',
    junitPriority: 'common',
  });
}

export const MEDICATIONS_EXPANSION: Medication[] = [
  D({ id: 'medication-ibuprofen', idn: 'ibuprofen', en: 'ibuprofen', ja: 'イブプロフェン', katakana: 'イブプロフェン', kana: 'いぶぷろふぇん', drugClassJapanese: 'NSAIDs', dosageForms: ['tablet', 'capsule', 'syrup'], indicationTerms: ['痛み', '発熱', '炎症'], whyJa: '痛みや炎症、熱を和らげるためのお薬です。', whyKana: 'いたみやえんしょう、ねつをやわらげるためのおくすりです。', whyIdn: 'Obat ini untuk meredakan nyeri, peradangan, atau demam.', whyEn: 'This medicine relieves pain, inflammation, or fever.', aliases: ['ブルフェン'], relatedDiseases: ['発熱'], adverse: [line('胃の痛み', 'いのいたみ', 'nyeri lambung', 'stomach pain'), line('腎機能の悪化', 'じんきのうのあっか', 'perburukan fungsi ginjal', 'worsening kidney function')] }),
  D({ id: 'medication-diclofenac', idn: 'diklofenak', en: 'diclofenac', ja: 'ジクロフェナク', katakana: 'ジクロフェナク', kana: 'じくろふぇなく', drugClassJapanese: 'NSAIDs', dosageForms: ['tablet', 'suppository', 'topical gel'], indicationTerms: ['痛み', '関節痛', '炎症'], whyJa: '痛みと炎症を抑えるためのお薬です。', whyKana: 'いたみとえんしょうをおさえるためのおくすりです。', whyIdn: 'Obat ini untuk mengurangi nyeri dan peradangan.', whyEn: 'This medicine reduces pain and inflammation.', aliases: ['ボルタレン'], relatedDiseases: ['関節痛'] }),
  D({ id: 'medication-omeprazole', idn: 'omeprazol', en: 'omeprazole', ja: 'オメプラゾール', katakana: 'オメプラゾール', kana: 'おめぷらぞーる', drugClassJapanese: 'プロトンポンプ阻害薬', dosageForms: ['capsule', 'tablet'], indicationTerms: ['胃潰瘍', '逆流性食道炎'], whyJa: '胃酸を抑えて、胃や食道を守るためのお薬です。', whyKana: 'いさんをおさえて、いやしょくどうをまもるためのおくすりです。', whyIdn: 'Obat ini menekan asam lambung dan melindungi lambung atau esofagus.', whyEn: 'This medicine reduces stomach acid and protects the stomach or esophagus.', aliases: ['オメプラール'], relatedDiseases: ['胃潰瘍', '逆流性食道炎'] }),
  D({ id: 'medication-metformin', idn: 'metformin', en: 'metformin', ja: 'メトホルミン', katakana: 'メトホルミン', kana: 'めとほるみん', drugClassJapanese: 'ビグアナイド薬', dosageForms: ['tablet'], indicationTerms: ['2型糖尿病', '高血糖'], whyJa: '血糖値を下げるためのお薬です。', whyKana: 'けっとうちをさげるためのおくすりです。', whyIdn: 'Obat ini membantu menurunkan gula darah.', whyEn: 'This medicine helps lower blood glucose.', aliases: ['メトグルコ'], relatedDiseases: ['2型糖尿病'], adverse: [line('吐き気や下痢', 'はきけやげり', 'mual atau diare', 'nausea or diarrhea')] }),
  D({ id: 'medication-glimepiride', idn: 'glimepiride', en: 'glimepiride', ja: 'グリメピリド', katakana: 'グリメピリド', kana: 'ぐりめぴりど', drugClassJapanese: 'スルホニル尿素薬', dosageForms: ['tablet'], indicationTerms: ['2型糖尿病'], whyJa: '膵臓からインスリンを出しやすくして血糖を下げるお薬です。', whyKana: 'すいぞうからいんすりんをだしやすくしてけっとうをさげるおくすりです。', whyIdn: 'Obat ini menurunkan gula darah dengan membantu pankreas mengeluarkan insulin.', whyEn: 'This medicine lowers glucose by helping the pancreas release insulin.', relatedDiseases: ['2型糖尿病'], adverse: [line('低血糖', 'ていけっとう', 'gula darah rendah', 'low blood glucose')] }),
  D({ id: 'medication-insulin-glargine', idn: 'insulin glargine', en: 'insulin glargine', ja: 'インスリン グラルギン', katakana: 'インスリン グラルギン', kana: 'いんすりん ぐらるぎん', drugClassJapanese: '持効型インスリン', dosageForms: ['injection pen'], indicationTerms: ['糖尿病', '高血糖'], whyJa: '一日の血糖を安定させるための基礎インスリンです。', whyKana: 'いちにちのけっとうをあんていさせるためのきそいんすりんです。', whyIdn: 'Ini adalah insulin basal untuk menstabilkan gula darah sepanjang hari.', whyEn: 'This is basal insulin to stabilize blood glucose through the day.', aliases: ['ランタス'], relatedDiseases: ['糖尿病'], adverse: [line('低血糖', 'ていけっとう', 'gula darah rendah', 'low blood glucose')] }),
  D({ id: 'medication-losartan', idn: 'losartan', en: 'losartan', ja: 'ロサルタン', katakana: 'ロサルタン', kana: 'ろさるたん', drugClassJapanese: 'アンジオテンシンII受容体拮抗薬', dosageForms: ['tablet'], indicationTerms: ['高血圧', '腎症'], whyJa: '血圧を下げ、心臓や腎臓を守るためのお薬です。', whyKana: 'けつあつをさげ、しんぞうやじんぞうをまもるためのおくすりです。', whyIdn: 'Obat ini menurunkan tekanan darah dan melindungi jantung serta ginjal.', whyEn: 'This medicine lowers blood pressure and protects the heart and kidneys.', aliases: ['ニューロタン'], relatedDiseases: ['高血圧'], adverse: [line('高カリウム血症', 'こうかりうむけっしょう', 'hiperkalemia', 'high potassium')] }),
  D({ id: 'medication-bisoprolol', idn: 'bisoprolol', en: 'bisoprolol', ja: 'ビソプロロール', katakana: 'ビソプロロール', kana: 'びそぷろろーる', drugClassJapanese: 'β遮断薬', dosageForms: ['tablet'], indicationTerms: ['高血圧', '頻脈', '心不全'], whyJa: '心拍数を抑えて、心臓の負担を減らすお薬です。', whyKana: 'しんぱくすうをおさえて、しんぞうのふたんをへらすおくすりです。', whyIdn: 'Obat ini memperlambat denyut jantung dan mengurangi beban jantung.', whyEn: 'This medicine slows the heart rate and reduces strain on the heart.', aliases: ['メインテート'], relatedDiseases: ['心不全', '心房細動'], adverse: [line('脈が遅い', 'みゃくがおそい', 'denyut nadi lambat', 'slow pulse')] }),
  D({ id: 'medication-furosemide', idn: 'furosemide', en: 'furosemide', ja: 'フロセミド', katakana: 'フロセミド', kana: 'ふろせみど', drugClassJapanese: 'ループ利尿薬', dosageForms: ['tablet', 'injection'], indicationTerms: ['心不全', '浮腫'], whyJa: '余分な水分を尿として出し、むくみや息苦しさを軽くするお薬です。', whyKana: 'よぶんなすいぶんをにょうとしてだし、むくみやいきぐるしさをかるくするおくすりです。', whyIdn: 'Obat ini membuang kelebihan cairan melalui urine untuk mengurangi bengkak dan sesak.', whyEn: 'This medicine removes excess fluid in the urine to reduce swelling and breathlessness.', aliases: ['ラシックス'], relatedDiseases: ['心不全', '浮腫'], adverse: [line('脱水', 'だっすい', 'dehidrasi', 'dehydration'), line('低カリウム血症', 'ていかりうむけっしょう', 'hipokalemia', 'low potassium')] }),
  D({ id: 'medication-spironolactone', idn: 'spironolakton', en: 'spironolactone', ja: 'スピロノラクトン', katakana: 'スピロノラクトン', kana: 'すぴろのらくとん', drugClassJapanese: 'カリウム保持性利尿薬', dosageForms: ['tablet'], indicationTerms: ['心不全', '浮腫', '高血圧'], whyJa: '体の余分な水分を出しながら、心臓を助けるお薬です。', whyKana: 'からだのよぶんなすいぶんをだしながら、しんぞうをたすけるおくすりです。', whyIdn: 'Obat ini membantu jantung sambil membuang kelebihan cairan.', whyEn: 'This medicine helps the heart while removing excess fluid.', aliases: ['アルダクトンA'], relatedDiseases: ['心不全'], adverse: [line('高カリウム血症', 'こうかりうむけっしょう', 'hiperkalemia', 'high potassium')] }),
  D({ id: 'medication-warfarin', idn: 'warfarin', en: 'warfarin', ja: 'ワルファリン', katakana: 'ワルファリン', kana: 'わるふぁりん', drugClassJapanese: 'ビタミンK拮抗薬', dosageForms: ['tablet'], indicationTerms: ['心房細動', '血栓症'], whyJa: '血栓ができるのを防ぐためのお薬です。', whyKana: 'けっせんができるのをふせぐためのおくすりです。', whyIdn: 'Obat ini mencegah terbentuknya bekuan darah.', whyEn: 'This medicine prevents blood clots from forming.', aliases: ['ワーファリン'], relatedDiseases: ['心房細動'], adverse: [line('出血', 'しゅっけつ', 'perdarahan', 'bleeding')] }),
  D({ id: 'medication-apixaban', idn: 'apixaban', en: 'apixaban', ja: 'アピキサバン', katakana: 'アピキサバン', kana: 'あぴきさばん', drugClassJapanese: '直接作用型経口抗凝固薬', dosageForms: ['tablet'], indicationTerms: ['心房細動', '静脈血栓塞栓症'], whyJa: '血栓や脳梗塞を防ぐためのお薬です。', whyKana: 'けっせんやのうこうそくをふせぐためのおくすりです。', whyIdn: 'Obat ini mencegah bekuan darah dan stroke.', whyEn: 'This medicine prevents blood clots and stroke.', aliases: ['エリキュース'], relatedDiseases: ['心房細動'], adverse: [line('出血', 'しゅっけつ', 'perdarahan', 'bleeding')] }),
  D({ id: 'medication-atorvastatin', idn: 'atorvastatin', en: 'atorvastatin', ja: 'アトルバスタチン', katakana: 'アトルバスタチン', kana: 'あとるばすたちん', drugClassJapanese: 'HMG-CoA還元酵素阻害薬', dosageForms: ['tablet'], indicationTerms: ['高コレステロール血症', '動脈硬化'], whyJa: '血液中の悪玉コレステロールを下げ、血管を守るお薬です。', whyKana: 'けつえきちゅうのあくだまこれすてろーるをさげ、けっかんをまもるおくすりです。', whyIdn: 'Obat ini menurunkan kolesterol LDL dan melindungi pembuluh darah.', whyEn: 'This medicine lowers LDL cholesterol and protects blood vessels.', aliases: ['リピトール'], relatedDiseases: ['脂質異常症'], adverse: [line('筋肉痛', 'きんにくつう', 'nyeri otot', 'muscle pain')] }),
  D({ id: 'medication-salbutamol', idn: 'salbutamol', en: 'salbutamol / albuterol', ja: 'サルブタモール', katakana: 'サルブタモール', kana: 'さるぶたもーる', drugClassJapanese: '短時間作用型β2刺激薬', dosageForms: ['inhaler', 'nebulizer'], indicationTerms: ['喘息', '気管支攣縮'], whyJa: '気管支を広げて、息をしやすくする吸入薬です。', whyKana: 'きかんしをひろげて、いきをしやすくするきゅうにゅうやくです。', whyIdn: 'Obat hirup ini melebarkan bronkus agar bernapas lebih mudah.', whyEn: 'This inhaled medicine opens the airways to make breathing easier.', aliases: ['サルタノール'], relatedDiseases: ['喘息', 'COPD'], adverse: [line('動悸', 'どうき', 'palpitasi', 'palpitations')] }),
  D({ id: 'medication-budesonide', idn: 'budesonide', en: 'budesonide', ja: 'ブデソニド', katakana: 'ブデソニド', kana: 'ぶでそにど', drugClassJapanese: '吸入ステロイド薬', dosageForms: ['inhaler', 'nebulizer'], indicationTerms: ['喘息', 'COPD'], whyJa: '気道の炎症を抑えて、発作を起こしにくくする吸入薬です。', whyKana: 'きどうのえんしょうをおさえて、ほっさをおこしにくくするきゅうにゅうやくです。', whyIdn: 'Obat hirup ini mengurangi peradangan saluran napas dan mencegah serangan.', whyEn: 'This inhaled medicine reduces airway inflammation and prevents attacks.', aliases: ['パルミコート'], relatedDiseases: ['喘息', 'COPD'] }),
  D({ id: 'medication-ceftriaxone', idn: 'seftriakson', en: 'ceftriaxone', ja: 'セフトリアキソン', katakana: 'セフトリアキソン', kana: 'せふとりあきそん', drugClassJapanese: '第3世代セフェム系抗菌薬', dosageForms: ['injection'], indicationTerms: ['重症細菌感染症', '肺炎'], whyJa: '細菌による感染症を治療するための注射薬です。', whyKana: 'さいきんによるかんせんしょうをちりょうするためのちゅうしゃやくです。', whyIdn: 'Obat suntik ini mengobati infeksi bakteri.', whyEn: 'This injectable medicine treats bacterial infections.', aliases: ['ロセフィン'], relatedDiseases: ['肺炎', '敗血症'] }),
  D({ id: 'medication-azithromycin', idn: 'azitromisin', en: 'azithromycin', ja: 'アジスロマイシン', katakana: 'アジスロマイシン', kana: 'あじすろまいしん', drugClassJapanese: 'マクロライド系抗菌薬', dosageForms: ['tablet', 'syrup', 'injection'], indicationTerms: ['呼吸器感染症', '非定型肺炎'], whyJa: '細菌による呼吸器などの感染症を治療するお薬です。', whyKana: 'さいきんによるこきゅうきなどのかんせんしょうをちりょうするおくすりです。', whyIdn: 'Obat ini mengobati infeksi bakteri, termasuk infeksi saluran napas.', whyEn: 'This medicine treats bacterial infections, including respiratory infections.', aliases: ['ジスロマック'], relatedDiseases: ['肺炎'] }),
  D({ id: 'medication-ondansetron', idn: 'ondansetron', en: 'ondansetron', ja: 'オンダンセトロン', katakana: 'オンダンセトロン', kana: 'おんだんせとろん', drugClassJapanese: '制吐薬', dosageForms: ['tablet', 'injection'], indicationTerms: ['悪心', '嘔吐'], whyJa: '吐き気や嘔吐を抑えるためのお薬です。', whyKana: 'はきけやおうとをおさえるためのおくすりです。', whyIdn: 'Obat ini untuk mengurangi mual dan muntah.', whyEn: 'This medicine reduces nausea and vomiting.', aliases: ['ゾフラン'], relatedDiseases: ['悪心', '嘔吐'] }),
  D({ id: 'medication-morphine', idn: 'morfin', en: 'morphine', ja: 'モルヒネ', katakana: 'モルヒネ', kana: 'もるひね', drugClassJapanese: 'オピオイド鎮痛薬', dosageForms: ['injection', 'tablet', 'oral solution'], indicationTerms: ['強い痛み', '呼吸困難'], whyJa: '強い痛みや苦しさを和らげるためのお薬です。', whyKana: 'つよいいたみやくるしさをやわらげるためのおくすりです。', whyIdn: 'Obat ini meredakan nyeri berat atau rasa sesak yang berat.', whyEn: 'This medicine relieves severe pain or severe breathlessness.', aliases: ['MSコンチン'], relatedDiseases: ['がん疼痛', '緩和ケア'], adverse: [line('眠気', 'ねむけ', 'kantuk', 'drowsiness'), line('便秘', 'べんぴ', 'konstipasi', 'constipation')] }),
];
