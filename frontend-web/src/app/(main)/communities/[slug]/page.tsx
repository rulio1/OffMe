import { CommunityDetailView } from '@/components/communities/CommunityDetailView';

export default function CommunityDetailPage({ params }: { params: { slug: string } }) {
  return <CommunityDetailView slug={params.slug} />;
}