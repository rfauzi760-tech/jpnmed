import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { READINGS, getReading, resolveGrammarRefs, resolveVocabRefs } from '@/lib/content';
import { aidsForText } from '@/lib/content/lookup';
import { PageBody } from '@/components/shell/app-shell';
import { ReadingWorkspace, type PassageMeta } from '@/components/reading/workspace';
import type { QuestionView } from '@/components/reading/question-pane';

export function generateStaticParams() {
  return READINGS.map((passage) => ({ id: passage.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const passage = getReading(id);
  if (!passage) return { title: 'Reading' };
  return { title: passage.title, description: passage.titleEn ?? passage.topic };
}

export default async function ReadingPassagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const passage = getReading(id);
  if (!passage) notFound();

  // Aids are derived per passage so only the relevant dictionary ships.
  const aids = aidsForText(passage.text);

  const questions: QuestionView[] = passage.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options.map((option) => ({ text: option.text, why: option.why, trap: option.trap })),
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    skill: question.skill,
    evidenceParagraph: question.evidenceParagraph,
    evidenceSentence: question.evidenceSentence,
    howEvidenceWorks: question.howEvidenceWorks,
    paraphrase: question.paraphrase,
    grammarRefs: [
      ...resolveGrammarRefs([...question.grammarRefs, ...question.grammarIds]).map((entry) => ({
        id: entry.id,
        pattern: entry.pattern,
        meaning: entry.meaning,
      })),
    ],
    vocabRefs: [
      ...resolveVocabRefs([...question.vocabRefs, ...question.vocabularyIds]).map((word) => ({
        id: word.id,
        japanese: word.japanese,
        kana: word.kana,
        meaningsEn: word.meaningsEn,
      })),
    ],
  }));

  const meta: PassageMeta = {
    id: passage.id,
    title: passage.title,
    titleEn: passage.titleEn,
    category: passage.category,
    level: passage.level,
    topic: passage.topic,
    characterCount: passage.characterCount,
    estimatedMinutes: passage.estimatedMinutes,
    difficulty: passage.difficulty,
    paragraphs: passage.paragraphs.map((paragraph) => ({
      index: paragraph.index,
      text: paragraph.text,
      kana: paragraph.kana,
      romaji: paragraph.romaji,
      indonesian: paragraph.indonesian,
      english: paragraph.english,
      languageSupportStatus: paragraph.languageSupportStatus,
      role: paragraph.role,
    })),
    languageSupportStatus: passage.languageSupportStatus,
    verificationStatus: passage.verificationStatus,
  };

  const order = READINGS.findIndex((item) => item.id === passage.id);
  const available = [0, 1, 2]
    .map((offset) => READINGS[(order + 1 + offset) % READINGS.length])
    .filter((item) => item && item.id !== passage.id)
    .map((item) => ({ id: item.id, title: item.title, level: item.level }));

  return (
    <PageBody wide>
      <ReadingWorkspace passage={meta} questions={questions} aids={aids} available={available} />
    </PageBody>
  );
}
