'use client';

import { useEffect } from 'react';
import { useStudy } from '@/lib/store/provider';

/* ------------------------------------------------------------------
   Theme and reading preferences.

   The first paint is handled by an inline script in the document head so
   there is no flash of the wrong theme. This provider keeps the document
   in sync afterwards and exposes the same CSS variables the reading
   workspace uses for size, leading and measure.
------------------------------------------------------------------ */

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state, ready } = useStudy();
  const { settings } = state;

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && media.matches);
      root.classList.toggle('dark', dark);
      root.style.colorScheme = dark ? 'dark' : 'light';
    };

    apply();
    if (settings.theme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
    return undefined;
  }, [ready, settings.theme]);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.accent = settings.accent;
    root.style.setProperty('--reading-size', `${settings.readingSize}px`);
    root.style.setProperty('--reading-leading', `${settings.readingLeading}`);
    root.style.setProperty('--reading-width', `${settings.readingWidthRem}rem`);
  }, [ready, settings.accent, settings.readingSize, settings.readingLeading, settings.readingWidthRem]);

  return <>{children}</>;
}
