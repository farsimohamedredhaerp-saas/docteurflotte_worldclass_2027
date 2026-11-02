import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { DemoModeProvider } from '../context/DemoModeContext';
import { SystemConfigProvider } from '../context/SystemConfigContext';
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
      <body className="font-sans antialiased bg-[#080b11] text-slate-100" suppressHydrationWarning>
        <ThemeProvider>
          <DemoModeProvider>
            <SystemConfigProvider>
              <DemoModeBanner />
              {children}
            </SystemConfigProvider>
          </DemoModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
