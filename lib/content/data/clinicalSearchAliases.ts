/**
 * Everyday Indonesian, English, abbreviation, and patient-wording aliases for
 * stable medical-content IDs. Keep this separate from Japanese display names:
 * an alias improves discovery; it does not claim that two concepts are exact
 * clinical synonyms.
 */
export const CLINICAL_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'sym-geri': ['mencret', 'BAB cair', 'buang air besar cair', 'berak cair', 'watery stool', 'loose stool', 'diare akut'],
  'sym-kushami': ['bersin', 'sneeze', 'sneezing'],
  'dis-kyuuseigerishou': ['diare', 'diare akut', 'mencret', 'BAB cair', 'berak cair', 'acute diarrhea', 'loose stools'],
  'dis-kansenseichouen': ['diare infeksi', 'diare karena infeksi', 'gastroenteritis', 'gastroenteritis akut', 'gastroenteritis infeksius', 'acute gastroenteritis', 'infectious diarrhea', 'foodborne gastroenteritis'],
  'dis-arerugiiseibien': ['hay fever', '花粉症', 'polinosis', 'alergi serbuk sari'],
  'sym-youtsuu': ['nyeri menjalar', 'sakit pinggang menjalar', 'nyeri pinggang sampai kaki', 'radiating back pain', 'pain radiating to the leg'],
  'sym-zakotsushinkeitsuu': ['nyeri menjalar', 'nyeri skiatika', 'sakit dari bokong sampai kaki', 'sciatica', 'radicular leg pain'],
  'dis-youtsuitsuikanbanherunia': ['HNP', 'hernia nukleus pulposus', 'hernia nucleus pulposus', 'saraf kejepit', 'saraf terjepit', 'hernia diskus lumbal', 'lumbar HNP', 'lumbar disc prolapse', 'nyeri menjalar ke kaki'],
  'dis-keitsuitsuikanbanherunia': ['HNP', 'HNP servikal', 'hernia nukleus pulposus leher', 'saraf kejepit leher', 'cervical HNP', 'cervical disc prolapse'],
  'dis-youbusekichuukankyousakushou': ['stenosis spinal lumbal', 'penyempitan kanal tulang belakang pinggang', 'lumbar spinal stenosis', 'nyeri menjalar ke kaki'],
  'dis-joukidouen': ['ISPA', 'batuk pilek', 'selesma', 'common cold', 'acute nasopharyngitis', 'upper respiratory infection'],
  'dis-kyuuseiintouen': ['radang tenggorokan', 'faringitis akut', 'sakit tenggorokan', 'acute pharyngitis', 'sore throat infection'],
  'dis-hifuen': ['dermatitis', 'radang kulit', 'iritasi kulit', 'skin inflammation'],
  'dis-benpishou': ['konstipasi', 'sembelit', 'susah BAB', 'sulit buang air besar', 'constipation'],
  'dis-saikinseisekiri': ['disentri', 'disentri basiler', 'diare berdarah', 'bacillary dysentery', 'shigellosis'],
  'dis-teashikuchibyou': ['flu singapura', 'penyakit tangan kaki mulut', 'hand foot and mouth disease', 'HFMD'],
  'dis-mashin': ['campak', 'measles', 'rubeola'],
  'dis-reputosupirashou': ['leptospirosis', 'lepto', 'kencing tikus', 'demam leptospirosis'],
  'dis-chikungunianetsu': ['chikungunya', 'demam chikungunya', 'chikungunya fever'],
  'dis-mararia': ['malaria', 'demam malaria'],
  'dis-chouchifusu': ['tifoid', 'demam tifoid', 'tipes', 'typhoid'],
  'dis-kaisen': ['kudis', 'skabies', 'scabies'],
  'dis-ishokudougyakuryuushou': ['GERD', 'asam lambung naik', 'refluks asam', 'heartburn', 'acid reflux'],
};

export function clinicalSearchAliasesFor(id: string): readonly string[] {
  return CLINICAL_SEARCH_ALIASES[id] ?? [];
}
