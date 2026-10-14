'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ESSENTIAL_GROUPS, filterEssentialGroups } from '@/lib/content/essential';
import { useStudy } from '@/lib/store/provider';
import { Button, PageHeader } from '@/components/ui/primitives';
import { JUnitPhraseLine } from './j-unit-mode';
import { CopyButton } from '@/components/ui/interactive';

function WordReading({ japanese, kana, romaji }: { japanese: string; kana: string; romaji: string }) {
  const { state } = useStudy();
  const display = state.settings.medicalDisplay;
  const showKana = display.furigana === 'always' || (display.furigana === 'difficult' && /[\u3400-\u9fff]/.test(japanese));
  return <div className="group"><span lang="ja" className="font-medium text-foreground">{japanese}</span>{showKana ? <p lang="ja" className="mt-1 text-sm text-muted">{kana}</p> : null}{display.romaji !== 'off' ? <p className={`mt-1 text-sm text-info ${display.romaji === 'hover' ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' : ''}`}>{romaji}</p> : null}</div>;
}

export function EssentialCommunication() {
  const [topic, setTopic] = useState('all');
  const [query, setQuery] = useState('');
  const { actions, ready, state } = useStudy();
  const groups = useMemo(() => filterEssentialGroups(topic, query), [topic, query]);
  const phrases = groups.flatMap((group) => group.phrases);
  return <div className="space-y-5">
    <PageHeader eyebrow="Essential · J-Unit" title="Panduan lengkap komunikasi dokter–pasien" description="Naskah utuh, urutan percakapan, bedah kosakata dan kanji, serta tata bahasa dan nuansa. Anda memimpin konsultasi sebagai dokter, bersama perawat yang membantu menerjemahkan." meta={<span>{ESSENTIAL_GROUPS.reduce((count, group) => count + group.phrases.length, 0)} frasa & naskah · {ESSENTIAL_GROUPS.length} panduan lengkap</span>} />
    <div className="flex flex-wrap gap-3 text-sm"><Link href="/medical/j-unit" className="text-primary underline">Alur J-Unit</Link><Link href="/medical/phrases" className="text-primary underline">Semua frasa klinis</Link></div>
    <label className="block"><span className="mb-1 block text-sm text-muted">Cari kalimat atau arti</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="asuransi, spesialis, tsūyaku, 入院…" className="w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /></label>
    <div className="flex flex-wrap gap-2" aria-label="Topik essential">
      {[{ id: 'all', title: 'Semua topik' }, ...ESSENTIAL_GROUPS].map((group) => <Button key={group.id} size="sm" variant={topic === group.id ? 'primary' : 'secondary'} aria-pressed={topic === group.id} onClick={() => setTopic(group.id)}>{group.title}</Button>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted">{phrases.length} frasa ditemukan</p><Button size="sm" variant="secondary" disabled={!ready || !phrases.length} onClick={() => actions.addManyToReview(phrases.map((phrase) => ({ contentType: 'clinical-phrase' as const, contentId: phrase.id })))}>Tambahkan hasil ke review</Button></div>
    {groups.map((group) => <section key={group.id} className="space-y-3" aria-label={group.title}>
      <div className="border-b border-border pb-2"><h2 className="text-lg font-semibold text-foreground">{group.title}</h2><p className="mt-1 text-sm text-muted">{group.description}</p></div>
      <div className="rounded-lg bg-surface-secondary/40 p-4"><h3 className="font-semibold text-foreground">Situasi & cara menggunakannya</h3><p className="mt-2 text-sm leading-relaxed text-foreground">{group.guide.situation}</p>{group.guide.explanation.map((text) => <p key={text} className="mt-2 text-sm leading-relaxed text-muted">{text}</p>)}</div>
      {group.phrases.filter((phrase) => phrase.id.endsWith('-full')).map((phrase) => <div key={phrase.id} className="space-y-2"><h3 className="font-semibold text-foreground">Naskah lengkap siap diucapkan</h3><JUnitPhraseLine phrase={{ ...phrase, notes: undefined }} /><CopyButton text={[phrase.japanese, phrase.kana, phrase.romaji, phrase.indonesian].join('\n\n')} /></div>)}
      <h3 className="pt-2 font-semibold text-foreground">Urutan percakapan & pilihan respons</h3>
      {group.guide.sequence.map((key) => group.phrases.find((phrase) => phrase.id === `ph-essential-${group.id}-${key}`)).filter((phrase) => phrase !== undefined).map((phrase) => <div key={phrase.id} className="space-y-1"><JUnitPhraseLine phrase={phrase} /><Link className="inline-block px-1 text-xs text-primary underline" href={`/medical/phrases?stage=${phrase.stage}&p=${phrase.id}`}>Buka di phrasebook</Link></div>)}
      <h3 className="pt-2 font-semibold text-foreground">Bedah kosakata & kanji</h3>
      <div className="grid gap-3 sm:grid-cols-2">{group.guide.words.map((word) => <article key={word.japanese} className="rounded-lg border border-border p-4"><WordReading {...word} /><p className="mt-2 text-sm text-foreground">{word.indonesian}</p>{state.settings.medicalDisplay.english ? <p className="mt-1 text-xs text-muted">{word.english}</p> : null}<p className="mt-2 text-sm leading-relaxed text-muted">{word.explanation}</p><p className="mt-2 border-t border-border pt-2 text-sm leading-relaxed text-muted">{word.kanji}</p></article>)}</div>
      <h3 className="pt-2 font-semibold text-foreground">Tata bahasa & nuansa klinis</h3>
      <div className="space-y-3">{group.guide.grammar.map((pattern) => <article key={pattern.japanese} className="rounded-lg border border-border p-4"><WordReading {...pattern} /><p className="mt-2 text-sm text-foreground">{pattern.meaning}</p><p className="mt-2 text-sm leading-relaxed text-muted">{pattern.explanation}</p></article>)}</div>
    </section>)}
    {!groups.length ? <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted"><p>Tidak ada frasa yang cocok.</p><Button className="mt-2" size="sm" variant="secondary" onClick={() => { setTopic('all'); setQuery(''); }}>Tampilkan semua topik</Button></div> : null}
  </div>;
}
