'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Braces,
  ChartLine,
  House,
  Layers,
  Monitor,
  Moon,
  NotebookPen,
  Settings,
  Stethoscope,
  Sun,
  Target,
  MoreHorizontal,
} from 'lucide-react';
import { useStudy } from '@/lib/store/provider';
import { dueReviewItems } from '@/lib/srs/queue';
import { cn } from '@/lib/utils/cn';
import { Badge, Button } from '@/components/ui/primitives';
import { Sheet } from '@/components/ui/interactive';
import { SearchTrigger } from './command-palette';

/* ------------------------------------------------------------------
   Application shell navigation.

   Desktop gets a persistent rail; mobile gets a compact bar plus a
   bottom navigation for the four daily-use sections, with everything
   else one tap away in a sheet.
------------------------------------------------------------------ */

export type NavItem = {
  href: string;
  label: string;
  ja: string;
  icon: React.ComponentType<{ className?: string }>;
  module: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Home', ja: 'ホーム', icon: House, module: 'home' },
  { href: '/review', label: 'Review', ja: '復習', icon: Layers, module: 'review' },
  { href: '/reading', label: 'Reading', ja: '読解', icon: BookOpen, module: 'reading' },
  { href: '/vocabulary', label: 'Vocabulary', ja: '語彙', icon: Layers, module: 'vocabulary' },
  { href: '/grammar', label: 'Grammar', ja: '文法', icon: Braces, module: 'grammar' },
  { href: '/medical', label: 'Medical', ja: '医療', icon: Stethoscope, module: 'medical' },
  { href: '/cases', label: 'Cases', ja: '症例', icon: Target, module: 'cases' },
  { href: '/notebook', label: 'Notebook', ja: 'ノート', icon: NotebookPen, module: 'notebook' },
  { href: '/progress', label: 'Progress', ja: '進捗', icon: ChartLine, module: 'progress' },
];

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: 'Study', items: PRIMARY_NAV.slice(0, 5) },
  { label: 'Clinical', items: PRIMARY_NAV.slice(5, 7) },
  { label: 'Personal', items: PRIMARY_NAV.slice(7) },
];

const MOBILE_NAV = PRIMARY_NAV.filter((item) => ['home', 'review', 'reading', 'medical'].includes(item.module));

function useActiveModule() {
  const pathname = usePathname();
  if (pathname === '/') return 'home';
  return pathname.split('/')[1] ?? 'home';
}

export function useDueCount() {
  const { state, ready } = useStudy();
  if (!ready) return { due: 0, ready: false };
  return { due: dueReviewItems(state.reviews).length, ready: true };
}

/* -------------------------------- Sidebar --------------------------------- */

export function Sidebar() {
  const active = useActiveModule();
  const { due } = useDueCount();
  const { state } = useStudy();
  const compact = state.settings.compactSidebar;

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r border-border bg-background transition-[width] duration-150 lg:block',
        compact ? 'w-[68px]' : 'w-[232px]',
      )}
    >
      <div className="sticky top-0 flex h-dvh flex-col">
        <div className={compact ? 'px-3 pb-3 pt-4' : 'px-4 pb-3 pt-4'}>
          {compact ? (
            <Link href="/" aria-label="J-Med Mastery" className="flex justify-center">
              <span lang="ja" className="text-[15px] font-semibold tracking-tight text-foreground">
                医
              </span>
            </Link>
          ) : (
            <>
              <Link href="/" className="flex items-baseline gap-2">
                <span className="text-[15px] font-semibold tracking-tight text-foreground">J-Med Mastery</span>
                <span lang="ja" className="text-[11px] text-muted">
                  医療日本語
                </span>
              </Link>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Japanese Learning OS · advanced reading and hospital Japanese
              </p>
            </>
          )}
        </div>

        <div className={compact ? 'px-2 pb-2' : 'px-3 pb-2'}>
          <SearchTrigger compact={compact} />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 scroll-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              {compact ? <div className="mx-2 mb-1 border-t border-border" /> : <div className="meta-label px-2 pb-1">{group.label}</div>}
              <ul>
                {group.items.map((item) => {
                  const isActive = active === item.module;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        title={compact ? item.label : undefined}
                        aria-label={compact ? item.label : undefined}
                        className={cn(
                          'group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] transition-colors',
                          compact && 'justify-center',
                          isActive
                            ? 'bg-surface-secondary font-medium text-foreground'
                            : 'text-muted-foreground hover:bg-surface-secondary/70 hover:text-foreground',
                        )}
                      >
                        {isActive ? <span className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-[2px] rounded-full bg-primary" /> : null}
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        {compact ? null : (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.module === 'review' && due > 0 ? (
                              <Badge tone="primary" className="tabular-nums">
                                {due}
                              </Badge>
                            ) : (
                              <span lang="ja" className="text-[11px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
                                {item.ja}
                              </span>
                            )}
                          </>
                        )}
                        {compact && item.module === 'review' && due > 0 ? (
                          <span className="absolute -right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={compact ? 'border-t border-border px-2 py-3' : 'border-t border-border px-3 py-3'}>
          {compact ? <ThemeMenu compact /> : <ThemeMenu />}
          <Link
            href="/settings"
            title={compact ? 'Settings & data' : undefined}
            className={cn(
              'mt-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground hover:bg-surface-secondary hover:text-foreground',
              compact && 'justify-center',
            )}
          >
            <Settings className="h-4 w-4" />
            {compact ? null : 'Settings & data'}
          </Link>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------ Theme switch ------------------------------ */

export function ThemeMenu({ compact }: { compact?: boolean }) {
  const { state, actions, ready } = useStudy();
  const theme = state.settings.theme;
  const options: { value: typeof theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  if (compact) {
    const currentIndex = options.findIndex((option) => option.value === theme);
    const next = options[(currentIndex + 1) % options.length];
    const Icon = next.icon;
    return (
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Theme: ${theme}. Switch to ${next.label}.`}
        className="h-8 w-8 p-0"
        onClick={() => actions.updateSettings({ theme: next.value })}
        disabled={!ready}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            title={option.label}
            aria-pressed={isActive}
            disabled={!ready}
            onClick={() => actions.updateSettings({ theme: option.value })}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-[5px] px-2 py-1 text-[11.5px] transition-colors',
              isActive ? 'bg-surface-secondary font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- Top bar --------------------------------- */

export function TopBar() {
  const { due } = useDueCount();
  const active = useActiveModule();
  const current = PRIMARY_NAV.find((item) => item.module === active);

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur lg:px-5">
      <Link href="/" className="flex items-baseline gap-1.5 lg:hidden">
        <span className="text-[13.5px] font-semibold tracking-tight">J-Med</span>
        <span lang="ja" className="text-[10.5px] text-muted">
          医療日本語
        </span>
      </Link>

      {current ? (
        <div className="hidden items-center gap-2 lg:flex">
          <span className="text-[13.5px] font-medium text-foreground">{current.label}</span>
          <span lang="ja" className="text-[11px] text-muted">
            {current.ja}
          </span>
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-1.5">
        {due > 0 ? (
          <Link
            href="/review"
            className="hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11.5px] text-muted-foreground hover:border-border-strong hover:text-foreground sm:flex"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="tabular-nums">{due}</span> due
          </Link>
        ) : null}
        <div className="lg:hidden">
          <SearchTrigger compact />
        </div>
        <div className="lg:hidden">
          <ThemeMenu compact />
        </div>
        <div className="hidden lg:block">
          <SearchTrigger compact />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Mobile nav -------------------------------- */

export function MobileNav() {
  const active = useActiveModule();
  const [moreOpen, setMoreOpen] = useState(false);
  const { due } = useDueCount();

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const isActive = active === item.module;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-2 text-[10.5px] transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <span className="relative">
                    <Icon className="h-[18px] w-[18px]" />
                    {item.module === 'review' && due > 0 ? (
                      <span className="absolute -right-1.5 -top-1 h-3.5 min-w-3.5 rounded-full bg-primary px-0.5 text-[9px] font-medium leading-[14px] text-primary-foreground">
                        {due > 99 ? '99' : due}
                      </span>
                    ) : null}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex w-full flex-col items-center gap-0.5 py-2 text-[10.5px] text-muted-foreground"
            >
              <MoreHorizontal className="h-[18px] w-[18px]" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="All sections" side="bottom">
        <ul className="grid grid-cols-2 gap-1">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-[13.5px] hover:bg-surface-secondary"
                >
                  <Icon className="h-4 w-4 text-muted" />
                  <span className="flex-1">{item.label}</span>
                  <span lang="ja" className="text-[11px] text-muted">
                    {item.ja}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="col-span-2">
            <Link
              href="/settings"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-[13.5px] hover:bg-surface-secondary"
            >
              <Settings className="h-4 w-4 text-muted" />
              Settings & data
            </Link>
          </li>
        </ul>
        <div className="mt-4">
          <ThemeMenu />
        </div>
      </Sheet>
    </>
  );
}
