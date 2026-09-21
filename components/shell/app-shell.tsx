import { CommandPalette } from './command-palette';
import { MobileNav, Sidebar, TopBar } from './nav';

/* ------------------------------------------------------------------
   Layout shell. Desktop keeps the rail always visible; mobile uses a
   bottom navigation with a safe-area gutter so review sessions sit
   comfortably on a phone.
------------------------------------------------------------------ */

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1 pb-24 lg:pb-10">{children}</main>
      </div>
      <MobileNav />
      <CommandPalette />
    </div>
  );
}

export function PageBody({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? 'mx-auto w-full px-4 py-5 sm:px-6 lg:px-7' : 'mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 lg:px-7'}>{children}</div>;
}
