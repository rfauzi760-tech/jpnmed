'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ESSENTIAL_GROUPS, filterEssentialGroups } from '@/lib/content/essential';
import { useStudy } from '@/lib/store/provider';
import { Button, PageHeader } from '@/components/ui/primitives';
import { JUnitPhraseLine } from './j-unit-mode';

export function EssentialCommunication() {
  const [topic, setTopic] = useState('all');
  const [query, setQuery] = useState('');
  const { actions, ready } = useStudy();
  const groups = useMemo(() => filterEssentialGroups(topic, query), [topic, query]);
  const phrases = groups.flatMap((group) => group.phrases);
  return <div className="space-y-5">
    <PageHeader eyebrow="Essential · J-Unit" title="Kalimat penting untuk praktik sehari-hari" description="Mulai dari perkenalan dan bantuan bahasa, pemeriksaan, pilihan spesialis, rawat inap, biaya, sampai pulang. Setiap kalimat dilengkapi kana, romaji, dan arti Indonesia." meta={<span>{ESSENTIAL_GROUPS.reduce((count, group) => count + group.phrases.length, 0)} frasa · {ESSENTIAL_GROUPS.length} topik</span>} />
    <div className="flex flex-wrap gap-3 text-sm"><Link href="/medical/j-unit" className="text-primary underline">Alur J-Unit</Link><Link href="/medical/phrases" className="text-primary underline">Semua frasa klinis</Link></div>
    <label className="block"><span className="mb-1 block text-sm text-muted">Cari kalimat atau arti</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="asuransi, spesialis, tsūyaku, 入院…" className="w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /></label>
    <div className="flex flex-wrap gap-2" aria-label="Topik essential">
      {[{ id: 'all', title: 'Semua topik' }, ...ESSENTIAL_GROUPS].map((group) => <Button key={group.id} size="sm" variant={topic === group.id ? 'primary' : 'secondary'} aria-pressed={topic === group.id} onClick={() => setTopic(group.id)}>{group.title}</Button>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted">{phrases.length} frasa ditemukan</p><Button size="sm" variant="secondary" disabled={!ready || !phrases.length} onClick={() => actions.addManyToReview(phrases.map((phrase) => ({ contentType: 'clinical-phrase' as const, contentId: phrase.id })))}>Tambahkan hasil ke review</Button></div>
    {groups.map((group) => <section key={group.id} className="space-y-3" aria-label={group.title}>
      <div className="border-b border-border pb-2"><h2 className="text-lg font-semibold text-foreground">{group.title}</h2><p className="mt-1 text-sm text-muted">{group.description}</p></div>
      {group.phrases.map((phrase) => <div key={phrase.id} className="space-y-1"><JUnitPhraseLine phrase={phrase} /><Link className="inline-block px-1 text-xs text-primary underline" href={`/medical/phrases?stage=${phrase.stage}&p=${phrase.id}`}>Buka di phrasebook</Link></div>)}
    </section>)}
    {!groups.length ? <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted"><p>Tidak ada frasa yang cocok.</p><Button className="mt-2" size="sm" variant="secondary" onClick={() => { setTopic('all'); setQuery(''); }}>Tampilkan semua topik</Button></div> : null}
  </div>;
}
