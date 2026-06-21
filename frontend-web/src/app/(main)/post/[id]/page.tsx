import { PostThreadView } from '@/components/post/PostThreadView';

export default function PostPage({ params }: { params: { id: string } }) {
  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return <div className="px-4 py-12 text-center text-red-400">Post inválido.</div>;
  }
  return <PostThreadView postId={postId} />;
}