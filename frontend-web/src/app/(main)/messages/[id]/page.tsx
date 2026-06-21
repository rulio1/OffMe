import { ConversationThread } from '@/components/messages/ConversationThread';

export default function ConversationPage({ params }: { params: { id: string } }) {
  const conversationId = Number(params.id);
  if (!Number.isFinite(conversationId)) {
    return <div className="px-4 py-12 text-center text-red-400">Conversa inválida.</div>;
  }
  return <ConversationThread conversationId={conversationId} />;
}