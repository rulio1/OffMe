'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { addListMember, fetchList } from '@/lib/api';

interface ListDetailViewProps {
  listId: number;
}

export function ListDetailView({ listId }: ListDetailViewProps) {
  const [username, setUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const { data, mutate, isLoading } = useSWR(`list-${listId}`, () => fetchList(listId), {
    revalidateOnFocus: false,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setAdding(true);
    setError('');
    try {
      await addListMember(listId, username.trim());
      setUsername('');
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar membro');
    } finally {
      setAdding(false);
    }
  };

  if (isLoading || !data) {
    return <p className="px-4 py-8 text-offme-muted">Carregando lista...</p>;
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-offme-border bg-offme-bg/80 px-3 py-2 backdrop-blur-md">
        <Link href="/lists" className="rounded-full p-2 hover:bg-offme-hover">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{data.list.name}</h1>
          <p className="text-sm text-offme-muted">{data.list.memberCount} membros</p>
        </div>
      </header>

      <form onSubmit={handleAdd} className="border-b border-offme-border px-4 py-4">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Adicionar @usuário"
          className="w-full rounded-xl border border-offme-border bg-offme-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-offme-accent"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={adding || !username.trim()}
          className="mt-3 rounded-full bg-offme-accent px-4 py-2 text-sm font-bold text-white hover:bg-offme-accentHover disabled:opacity-50"
        >
          {adding ? 'Adicionando...' : 'Adicionar membro'}
        </button>
      </form>

      {data.members.length === 0 ? (
        <p className="px-4 py-8 text-center text-offme-muted">Lista vazia.</p>
      ) : (
        data.members.map((member) => (
          <Link
            key={member.id}
            href={`/profile/${member.username}`}
            className="block border-b border-offme-border px-4 py-3 hover:bg-black/[0.02]"
          >
            <p className="font-bold">{member.displayName}</p>
            <p className="text-sm text-offme-muted">@{member.username}</p>
          </Link>
        ))
      )}
    </div>
  );
}