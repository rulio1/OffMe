import type { Metadata } from 'next';
import { ProfileView } from '@/components/profile/ProfileView';
import { getProfileOgData } from '@/lib/og-queries';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const row = await getProfileOgData(params.username);
  if (!row) {
    return { title: 'Perfil não encontrado' };
  }

  const title = `${row.display_name} (@${row.username})`;
  const description =
    row.bio?.trim().slice(0, 160) ||
    `Perfil de @${row.username} no ${SITE_NAME}`;
  const image = row.avatar_url || `${getSiteUrl()}/icon-512.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${getSiteUrl()}/profile/${row.username}`,
      siteName: SITE_NAME,
      type: 'profile',
      images: [{ url: image, alt: row.display_name }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [image],
    },
  };
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  return <ProfileView username={params.username} />;
}