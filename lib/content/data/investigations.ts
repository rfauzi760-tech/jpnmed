import { I } from '../builders';
import type { Investigation } from '../schema';
import { INVESTIGATIONS_EXPANSION } from './investigationExpansion';

const INVESTIGATIONS_CORE: Investigation[] = [
  I({
    id: 'investigation-blood-test', japanese: '血液検査', kana: 'けつえきけんさ', indonesian: 'pemeriksaan darah', english: 'blood test', category: 'laboratory', specialties: ['internal-medicine', 'emergency-medicine'], relatedDiseases: [], relatedTerms: ['血液'],
    patientExplanation: { japanese: '血液を少し採って、体の状態を調べます。', kana: 'けつえきをすこしとって、からだのじょうたいをしらべます。', indonesian: 'Kami mengambil sedikit darah untuk memeriksa kondisi tubuh.', english: 'We will take a small amount of blood to check your condition.' },
    preparationInstruction: { japanese: '採血の前に、体調が悪くなったら教えてください。', kana: 'さいけつのまえに、たいちょうがわるくなったらおしえてください。', indonesian: 'Sebelum pengambilan darah, beri tahu kami jika merasa tidak enak badan.', english: 'Tell us if you feel unwell before the blood draw.' },
    resultDiscussion: { japanese: '結果が出たら、項目ごとにご説明します。', kana: 'けっかがでたら、こうもくごとにごせつめいします。', indonesian: 'Setelah hasil keluar, kami akan menjelaskan tiap parameter.', english: 'When the results are ready, we will explain each item.' }, verificationStatus: 'reviewed', junitPriority: 'essential',
  }),
  I({
    id: 'investigation-chest-xray', japanese: '胸部エックス線検査', kana: 'きょうぶえっくすせんけんさ', indonesian: 'rontgen dada', english: 'chest X-ray', category: 'imaging', specialties: ['pulmonology', 'emergency-medicine'], relatedDiseases: [], relatedTerms: ['胸部'],
    patientExplanation: { japanese: '胸のレントゲン写真を撮って、肺や心臓を確認します。', kana: 'むねのれんとげんしゃしんをとって、はい やしんぞうをかくにんします。', indonesian: 'Kami mengambil foto rontgen dada untuk memeriksa paru dan jantung.', english: 'We will take a chest X-ray to check the lungs and heart.' },
    preparationInstruction: { japanese: '撮影中は息を止めて、動かないでください。', kana: 'さつえいちゅうはいきをとめて、うごかないでください。', indonesian: 'Saat pemotretan, tahan napas dan jangan bergerak.', english: 'Hold your breath and keep still during the image.' },
    resultDiscussion: { japanese: '画像を確認して、必要な検査を追加します。', kana: 'がぞうをかくにんして、ひつようなけんさをついかします。', indonesian: 'Kami akan melihat gambarnya dan menambah pemeriksaan bila perlu.', english: 'We will review the image and add tests if needed.' }, verificationStatus: 'reviewed', junitPriority: 'common',
  }),
  I({
    id: 'investigation-ct', japanese: 'CT検査', kana: 'しーてぃーけんさ', indonesian: 'pemeriksaan CT', english: 'CT scan', category: 'imaging', specialties: ['emergency-medicine', 'internal-medicine'], relatedDiseases: [], relatedTerms: ['画像検査'],
    patientExplanation: { japanese: '体の断面を詳しく見る画像検査です。', kana: 'からだのだんめんをくわしくみるがぞうけんさです。', indonesian: 'Ini adalah pemeriksaan pencitraan untuk melihat penampang tubuh secara rinci.', english: 'This imaging test shows detailed cross-sections of the body.' },
    preparationInstruction: { japanese: '造影剤を使う場合は、アレルギーや腎臓の病気を確認します。', kana: 'ぞうえいざいをつかうばあいは、あれるぎーやじんぞうのびょうきをかくにんします。', indonesian: 'Jika memakai zat kontras, kami akan menanyakan alergi dan penyakit ginjal.', english: 'If contrast is used, we will ask about allergies and kidney disease.' },
    resultDiscussion: { japanese: '検査結果をもとに、治療方針をご相談します。', kana: 'けんさけっかをもとに、ちりょうほうしんをごそうだんします。', indonesian: 'Berdasarkan hasil, kami akan membahas rencana terapi.', english: 'We will discuss the treatment plan based on the result.' }, verificationStatus: 'reviewed', junitPriority: 'common',
  }),
];

export const INVESTIGATIONS: Investigation[] = [...INVESTIGATIONS_CORE, ...INVESTIGATIONS_EXPANSION];
