import { ExploreView } from '@/components/explore/ExploreView';

export default function ExplorePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  return <ExploreView initialQuery={searchParams.q ?? ''} />;
}