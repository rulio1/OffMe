import type { Metadata, Viewport } from 'next';
import { AppSplash } from '@/components/layout/AppSplash';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { PwaProvider } from '@/components/providers/PwaProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'OffMe',
  description: 'Desconecte do ruído. Conecte com o que importa.',
  applicationName: 'OffMe',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OffMe',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1d9bf0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <PwaProvider>
            <AppSplash />
            {children}
          </PwaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}