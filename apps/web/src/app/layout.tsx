import type { Metadata, Viewport } from 'next';
import './tokens.css';
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Readex+Pro:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('df_theme');
                var activeTheme = savedTheme === 'light' ? 'light' : 'dark';
                document.documentElement.classList.add(activeTheme);
                document.documentElement.setAttribute('data-theme', activeTheme);
              } catch (e) {}
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var r of regs) { r.unregister(); }
                  });
                } else if (window.location.protocol.startsWith('http')) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[var(--df-bg-base)] text-[var(--df-text-main)] min-h-screen transition-colors duration-150" suppressHydrationWarning>
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
