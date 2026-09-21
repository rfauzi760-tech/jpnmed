/**
 * Minimal kana → romaji transliteration.
 *
 * Used only to build stable, readable, URL-safe content IDs from the kana
 * readings that every content item already has. It is not a general purpose
 * converter: kanji are dropped, katakana is folded to hiragana first.
 */

const DIGRAPHS: Record<string, string> = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
  てぃ: 'ti', でぃ: 'di', うぇ: 'we', うぃ: 'wi',
  しぇ: 'she', じぇ: 'je', ちぇ: 'che',
};

const MONOGRAPHS: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', ゐ: 'i', ゑ: 'e', を: 'o', ん: 'n',
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  ゔ: 'vu',
};

function toHiragana(input: string) {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    // Katakana block → hiragana block
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCodePoint(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out;
}

/** Full reading for sentences and clinical instruction lines. */
export function kanaToRomajiFull(input: string): string {
  const s = toHiragana(input.normalize('NFKC'));
  let out = '';
  let i = 0;
  while (i < s.length) {
    const two = s.slice(i, i + 2);
    if (DIGRAPHS[two]) {
      out += DIGRAPHS[two];
      i += 2;
      continue;
    }
    const ch = s[i];
    if (ch === 'っ') {
      // Double the next consonant.
      const next = DIGRAPHS[s.slice(i + 1, i + 3)] ?? MONOGRAPHS[s[i + 1] ?? ''] ?? '';
      out += next.charAt(0);
      i += 1;
      continue;
    }
    if (ch === 'ー') {
      // Long vowel mark: repeat the previous vowel.
      const vowel = out.match(/[aeiou](?!.*[aeiou])/);
      out += vowel ? vowel[0] : '';
      i += 1;
      continue;
    }
    const mapped = MONOGRAPHS[ch];
    if (mapped) {
      out += mapped;
      i += 1;
      continue;
    }
    // Kanji, punctuation, latin: keep latin alphanumerics, drop the rest.
    if (/[A-Za-z0-9]/.test(ch)) out += ch.toLowerCase();
    i += 1;
  }
  return out.replace(/[^a-z0-9]+/g, '');
}

/** Short reading used for stable ids and compact slugs. */
export function kanaToRomaji(input: string): string {
  return kanaToRomajiFull(input).slice(0, 28);
}

/** Deterministic slug used for content IDs and URLs. */
export function slugify(input: string, fallback = 'item'): string {
  const latin = input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return latin.length > 0 ? latin.slice(0, 40) : fallback;
}

/**
 * Builds stable content IDs of the form `voc-hokan`, `med-kyoutsuu`.
 * Collisions are resolved deterministically by appending a counter, and are
 * surfaced by the content integrity test so they can be fixed by hand.
 */
export function createIdFactory(prefix: string) {
  const used = new Map<string, number>();
  return (kana: string, hint?: string): string => {
    const base = `${prefix}-${kanaToRomaji(kana) || slugify(hint ?? '', 'item')}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  };
}
