import { ListDetailView } from '@/components/lists/ListDetailView';

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const listId = Number(params.id);
  if (!Number.isFinite(listId)) {
    return <p className="px-4 py-8 text-red-400">Lista inválida.</p>;
  }
  return <ListDetailView listId={listId} />;
}