'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/primitives';
import { openCommandPalette } from '@/components/shell/command-palette';

/* One input, two behaviours: Enter filters the dictionary, ⌘K searches everything. */
export function MedicalSearchBox() {
  const router = useRouter();
  const [value, setValue] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim().length === 0) return;
        router.push(`/medical/terms?q=${encodeURIComponent(value.trim())}`);
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search a term in Japanese, kana, English or Indonesian — 胸痛, きょうつう, chest pain, nyeri dada"
          className="pl-8"
          aria-label="Search medical terminology"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-secondary"
      >
        Search dictionary
      </button>
      <button
        type="button"
        onClick={() => openCommandPalette(value)}
        className="inline-flex h-9 items-center rounded-md px-2 text-[12.5px] text-muted-foreground hover:text-foreground"
      >
        or press ⌘K for everything
      </button>
    </form>
  );
}
