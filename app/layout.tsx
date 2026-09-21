import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/shell/app-shell';
import { ThemeProvider } from '@/components/shell/theme-provider';
import { StudyProvider } from '@/lib/store/provider';

export const metadata: Metadata = {
  title: {
    default: 'J-Med Mastery',
    template: '%s · J-Med Mastery',
  },
  description:
    'A personal Japanese Learning OS and medical Japanese knowledge system: advanced reading, spaced repetition, and clinically usable hospital Japanese.',
  applicationName: 'J-Med Mastery',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f3' },
    { media: '(prefers-color-scheme: dark)', color: '#14161a' },
  ],
};

/**
 * Applies the persisted theme before first paint. It reads the same
 * profile document the store uses, and fails safe to the system theme.
 */
const themeScript = `(function(){try{var raw=localStorage.getItem('jmed.profile.v3');var theme='system',accent='teal';if(raw){var p=JSON.parse(raw);if(p&&p.settings){theme=p.settings.theme||'system';accent=p.settings.accent||'teal';}}var dark=theme==='dark'||(theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(dark)r.classList.add('dark');r.dataset.accent=accent;r.style.colorScheme=dark?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Serif+JP:wght@400;500;600&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <StudyProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </StudyProvider>
      </body>
    </html>
  );
}
