import { S } from '../builders';
import type { Symptom } from '../schema';

/** Common primary-care symptom records absent from the original symptom set. */
export const PRIMARY_CARE_SYMPTOMS: Symptom[] = [
  S({
    ja: 'くしゃみ', kana: 'くしゃみ', en: 'sneezing', idn: 'bersin',
    pe: ['くしゃみが何度も出ます。', '鼻がむずむずして、くしゃみが止まりません。'],
    q: ['くしゃみはいつからですか。', '季節や場所によって悪くなりますか。', '鼻水や鼻づまり、目のかゆみもありますか。', '息苦しさや、唇・舌の腫れはありますか。'],
    desc: ['発作性', '季節性', '連発する'],
    sev: ['くしゃみが止まりません。', '朝起きたときに特に強いです。'],
    tim: ['花粉の季節に悪化します。', '掃除をした後に出ます。'],
    assoc: ['鼻水や鼻づまりはありますか。', '目のかゆみや涙はありますか。', '新しい薬や食べ物の後に出ましたか。'],
    red: ['息苦しさや喉の腫れを伴う', '急に全身へ広がるじんましん'],
    pf: '鼻の粘膜が刺激されたり、アレルギー反応が起きたりして、空気を強く吐き出す反射です。',
    ex: [
      ['花粉の時期になると、くしゃみと鼻水が止まりません。', '目のかゆみもありますか。毎年同じ季節に出ますか。', 'Do your eyes itch too? Does it happen in the same season each year?'],
    ],
    terms: ['アレルギー性鼻炎', '花粉症', '鼻水'],
  }),
];
