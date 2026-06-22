import type { Metadata } from 'next';
import { WelcomeView } from '@/components/landing/WelcomeView';
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Rede social sem ruído`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — Rede social sem ruído`,
    description: SITE_DESCRIPTION,
    url: `${getSiteUrl()}/welcome`,
    siteName: SITE_NAME,
    images: [{ url: `${getSiteUrl()}/icon-512.png`, width: 512, height: 512 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Rede social sem ruído`,
    description: SITE_DESCRIPTION,
    images: [`${getSiteUrl()}/icon-512.png`],
  },
};

export default function WelcomePage() {
  return <WelcomeView />;
}