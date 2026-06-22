import type { Metadata } from 'next';
import { PostThreadView } from '@/components/post/PostThreadView';
import { getPostOgData } from '@/lib/og-queries';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return { title: 'Post' };
  }

  const row = await getPostOgData(postId);
  if (!row) {
    return { title: 'Post não encontrado' };
  }

  const description = row.text.trim().slice(0, 160) || 'Post no OffMe';
  const title = `${row.display_name} (@${row.username})`;
  const image = row.avatar_url || `${getSiteUrl()}/icon-512.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${getSiteUrl()}/post/${postId}`,
      siteName: SITE_NAME,
      type: 'article',
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

export default function PostPage({ params }: { params: { id: string } }) {
  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return <div className="px-4 py-12 text-center text-red-400">Post inválido.</div>;
  }
  return <PostThreadView postId={postId} />;
}