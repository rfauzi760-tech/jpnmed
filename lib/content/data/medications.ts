import { M } from '../builders';
import type { Medication } from '../schema';
import { MEDICATIONS_EXPANSION } from './medicationExpansion';

/** Starter generic-drug coverage; RFSmed remains the dosing reference. */
const MEDICATIONS_CORE: Medication[] = [
  M({
    id: 'medication-paracetamol', indonesianGeneric: 'parasetamol', english: 'paracetamol / acetaminophen', japanese: 'アセトアミノフェン', katakana: 'アセトアミノフェン', kana: 'あせとあみのふぇん', drugClassJapanese: '解熱鎮痛薬', dosageForms: ['tablet', 'syrup', 'suppository'], indicationTerms: ['発熱', '痛み', 'demam', 'nyeri'], aliases: ['カロナール', 'obat demam'],
    whyPrescribed: { japanese: '熱や痛みを和らげるためのお薬です。', kana: 'ねつやいたみをやわらげるためのおくすりです。', indonesian: 'Obat ini untuk meredakan demam atau nyeri.', english: 'This medicine is to relieve fever or pain.' },
    frequencyInstruction: { japanese: '指示された回数に分けて飲んでください。', kana: 'しじされたかいすうにわけてのんでください。', indonesian: 'Minumlah sesuai frekuensi yang diinstruksikan.', english: 'Take it at the instructed frequency.' },
    mealInstruction: { japanese: '食事に関係なく飲めます。', kana: 'しょくじにかんけいなくのめます。', indonesian: 'Obat dapat diminum tanpa terkait waktu makan.', english: 'You may take it with or without food.' },
    prnInstruction: { japanese: '痛みや熱があるときに飲んでください。', kana: 'いたみやねつがあるときにのんでください。', indonesian: 'Minum saat nyeri atau demam muncul.', english: 'Take it when you have pain or fever.' },
    durationInstruction: { japanese: '症状が改善しても、指示された期間だけ使用してください。', kana: 'しょうじょうがかいぜんしても、しじされたきかんだけしようしてください。', indonesian: 'Gunakan hanya selama periode yang diinstruksikan.', english: 'Use it only for the instructed duration.' },
    adverseEffectVocabulary: [{ japanese: '肝障害', kana: 'かんしょうがい', indonesian: 'gangguan hati', english: 'liver injury' }],
    allergyQuestion: { japanese: 'この薬や解熱鎮痛薬で具合が悪くなったことはありますか。', kana: 'このくすりやげねつちんつうやくでぐあいがわるくなったことはありますか。', indonesian: 'Pernah merasa tidak enak badan setelah obat ini atau obat penurun demam/nyeri?', english: 'Have you ever felt unwell after this or another antipyretic/analgesic?' },
    reconciliationQuestions: [{ japanese: '市販の風邪薬や痛み止めも使っていますか。', kana: 'しはんのかぜぐすりやいたみどめもつかっていますか。', indonesian: 'Apakah Anda juga memakai obat flu atau pereda nyeri bebas?', english: 'Are you also taking over-the-counter cold or pain medicines?' }],
    relatedDiseases: ['発熱'], relatedClasses: ['解熱鎮痛薬'], verificationStatus: 'reviewed', junitPriority: 'essential',
  }),
  M({
    id: 'medication-amoxicillin', indonesianGeneric: 'amoksisilin', english: 'amoxicillin', japanese: 'アモキシシリン', katakana: 'アモキシシリン', kana: 'あもきしりん', drugClassJapanese: 'ペニシリン系抗菌薬', dosageForms: ['capsule', 'tablet', 'suspension'], indicationTerms: ['細菌感染症'], aliases: [],
    whyPrescribed: { japanese: '細菌による感染症を治療するためのお薬です。', kana: 'さいきんによるかんせんしょうをちりょうするためのおくすりです。', indonesian: 'Obat ini untuk mengobati infeksi bakteri.', english: 'This medicine treats a bacterial infection.' },
    frequencyInstruction: { japanese: '決められた間隔で、忘れずに飲んでください。', kana: 'きめられたかんかくで、わすれずにのんでください。', indonesian: 'Minum dengan interval yang ditentukan dan jangan lupa dosis.', english: 'Take it at the prescribed intervals without missing doses.' },
    mealInstruction: { japanese: '胃の具合が悪ければ、食後に飲んでください。', kana: 'いのぐあいがわるければ、しょくごにのんでください。', indonesian: 'Jika lambung tidak nyaman, minumlah setelah makan.', english: 'If your stomach is upset, take it after meals.' },
    prnInstruction: { japanese: '症状がなくても、自己判断で中止しないでください。', kana: 'しょうじょうがなくても、じこはんだんでちゅうししないでください。', indonesian: 'Jangan menghentikan sendiri meski gejala membaik.', english: 'Do not stop it on your own even if symptoms improve.' },
    durationInstruction: { japanese: '処方された日数分を最後まで飲んでください。', kana: 'しょほうされたにっすうぶんをさいごまでのんでください。', indonesian: 'Habiskan sesuai jumlah hari yang diresepkan.', english: 'Finish the prescribed course.' },
    adverseEffectVocabulary: [{ japanese: '発疹', kana: 'ほっしん', indonesian: 'ruam', english: 'rash' }, { japanese: '下痢', kana: 'げり', indonesian: 'diare', english: 'diarrhea' }],
    allergyQuestion: { japanese: 'ペニシリン系の薬で発疹や息苦しさが出たことはありますか。', kana: 'ぺにしりんけいのくすりでほっしんやいきぐるしさがでたことはありますか。', indonesian: 'Pernah mengalami ruam atau sesak setelah obat penisilin?', english: 'Have you ever had a rash or breathing difficulty with penicillin drugs?' },
    reconciliationQuestions: [{ japanese: '今飲んでいる抗菌薬はありますか。', kana: 'いまのんでいるこうきんやくはありますか。', indonesian: 'Apakah sedang minum antibiotik lain?', english: 'Are you taking another antibiotic now?' }],
    relatedDiseases: ['細菌感染症'], relatedClasses: ['ペニシリン系抗菌薬'], verificationStatus: 'reviewed', junitPriority: 'common',
  }),
  M({
    id: 'medication-amlodipine', indonesianGeneric: 'amlodipin', english: 'amlodipine', japanese: 'アムロジピン', katakana: 'アムロジピン', kana: 'あむろじぴん', drugClassJapanese: 'カルシウム拮抗薬', dosageForms: ['tablet'], indicationTerms: ['高血圧', '狭心症'], aliases: [],
    whyPrescribed: { japanese: '血圧を下げ、心臓の負担を減らすためのお薬です。', kana: 'けつあつをさげ、しんぞうのふたんをへらすためのおくすりです。', indonesian: 'Obat ini menurunkan tekanan darah dan beban jantung.', english: 'This medicine lowers blood pressure and reduces strain on the heart.' },
    frequencyInstruction: { japanese: '毎日同じ時間に一回飲んでください。', kana: 'まいにちおなじじかんにいっかいのんでください。', indonesian: 'Minum sekali sehari pada waktu yang sama.', english: 'Take it once daily at the same time.' },
    mealInstruction: { japanese: '食事に関係なく飲めます。', kana: 'しょくじにかんけいなくのめます。', indonesian: 'Obat dapat diminum tanpa terkait waktu makan.', english: 'You may take it with or without food.' },
    prnInstruction: { japanese: '血圧が高いときだけ飲む薬ではありません。', kana: 'けつあつがたかいときだけのむくすりではありません。', indonesian: 'Ini bukan obat yang diminum hanya saat tekanan darah tinggi.', english: 'This is not a medicine to take only when your blood pressure is high.' },
    durationInstruction: { japanese: '継続して飲み、血圧を記録してください。', kana: 'けいぞくしてのみ、けつあつをきろくしてください。', indonesian: 'Minum terus sesuai instruksi dan catat tekanan darah.', english: 'Keep taking it and record your blood pressure.' },
    adverseEffectVocabulary: [{ japanese: 'むくみ', kana: 'むくみ', indonesian: 'bengkak', english: 'swelling' }],
    allergyQuestion: { japanese: 'この薬を飲んで、顔や足のむくみはありませんか。', kana: 'このくすりをのんで、かおやあしのむくみはありませんか。', indonesian: 'Apakah wajah atau kaki membengkak setelah minum obat ini?', english: 'Have you noticed swelling of your face or legs after taking this?' },
    reconciliationQuestions: [{ japanese: '血圧の薬を毎日飲めていますか。', kana: 'けつあつのくすりをまいにちのめていますか。', indonesian: 'Apakah dapat minum obat tekanan darah setiap hari?', english: 'Are you able to take your blood-pressure medicine every day?' }],
    relatedDiseases: ['高血圧'], relatedClasses: ['カルシウム拮抗薬'], verificationStatus: 'reviewed', junitPriority: 'common',
  }),
];

export const MEDICATIONS: Medication[] = [...MEDICATIONS_CORE, ...MEDICATIONS_EXPANSION];
