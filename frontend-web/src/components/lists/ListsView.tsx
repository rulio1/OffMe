'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { createList, fetchLists } from '@/lib/api';

export function ListsView() {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const { data, mutate, isLoading } = useSWR('lists', fetchLists, {
    revalidateOnFocus: false,
  });

  const lists = data?.lists ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createList(name.trim());
      setName('');
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lista');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">Listas</h1>
        <p className="mt-1 text-sm text-offme-muted">Organize perfis em listas personalizadas</p>
      </header>

      <form onSubmit={handleCreate} className="border-b border-offme-border px-4 py-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da nova lista"
          maxLength={50}
          className="w-full rounded-xl border border-offme-border bg-offme-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-offme-accent"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="mt-3 rounded-full bg-offme-accent px-4 py-2 text-sm font-bold text-white hover:bg-offme-accentHover disabled:opacity-50"
        >
          {creating ? 'Criando...' : 'Criar lista'}
        </button>
      </form>

      {isLoading && <p className="px-4 py-8 text-offme-muted">Carregando...</p>}
      {!isLoading && lists.length === 0 && (
        <p className="px-4 py-8 text-center text-offme-muted">Nenhuma lista ainda.</p>
      )}
      {lists.map((list) => (
        <Link
          key={list.id}
          href={`/lists/${list.id}`}
          className="block border-b border-offme-border px-4 py-4 hover:bg-black/[0.02]"
        >
          <p className="font-bold">{list.name}</p>
          <p className="text-sm text-offme-muted">
            {list.memberCount} membros · {list.isPrivate ? 'Privada' : 'Pública'}
          </p>
        </Link>
      ))}
    </div>
  );
}