import { PHRASES } from './data/phrases';
import { ESSENTIAL_TOPICS } from './data/essentialCommunication';
import { ESSENTIAL_GUIDES } from './data/essentialGuides';

export const ESSENTIAL_GROUPS = ESSENTIAL_TOPICS.map(({ lines, ...topic }) => ({
  ...topic,
  guide: ESSENTIAL_GUIDES[topic.id],
  phrases: PHRASES.filter((phrase) => phrase.id.startsWith(`ph-essential-${topic.id}-`)),
}));

export function filterEssentialGroups(topicId: string, query: string) {
  const fold = (value: string) => value.normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const needle = fold(query.trim());
  return ESSENTIAL_GROUPS.filter((group) => topicId === 'all' || group.id === topicId).map((group) => ({
    ...group,
    phrases: group.phrases.filter((phrase) => !needle || fold([
      group.guide.situation, ...group.guide.explanation,
      ...group.guide.words.flatMap((word) => Object.values(word)),
      ...group.guide.grammar.flatMap((pattern) => Object.values(pattern)),
      group.title, phrase.intent, phrase.japanese, phrase.kana, phrase.romaji,
      phrase.indonesian, phrase.english, phrase.notes ?? '', ...phrase.relatedTermIds,
    ].join(' ')).includes(needle)),
  })).filter((group) => group.phrases.length > 0);
}
