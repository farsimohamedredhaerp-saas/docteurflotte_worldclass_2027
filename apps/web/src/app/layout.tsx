import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { DemoModeProvider } from '../context/DemoModeContext';
import { DemoModeBanner } from '../components/navigation/DemoModeBanner';

export const metadata: Metadata = {
  title: 'DocteurFlotte — Plateforme Décisionnelle & Maintenance des Actifs',
  description:
    'Plateforme SaaS décisionnelle, contrôle de gestion et maintenance proactive/préventive/prédictive des actifs opérationnels multi-métier.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#080b11',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('df_theme');
                var activeTheme = savedTheme === 'dark' ? 'dark' : 'light';
                document.documentElement.classList.add(activeTheme);
                document.documentElement.setAttribute('data-theme', activeTheme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <DemoModeProvider>
            <DemoModeBanner />
            {children}
          </DemoModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
