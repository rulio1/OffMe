'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { createCommunity, fetchCommunities } from '@/lib/api';

export function CommunitiesView() {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const { data, mutate, isLoading } = useSWR('communities', fetchCommunities, {
    revalidateOnFocus: false,
  });

  const communities = data?.communities ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createCommunity(name.trim());
      setName('');
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar comunidade');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">Comunidades</h1>
        <p className="mt-1 text-sm text-offme-muted">Espaços temáticos para conversar</p>
      </header>

      <form onSubmit={handleCreate} className="border-b border-offme-border px-4 py-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da nova comunidade"
          maxLength={50}
          className="w-full rounded-xl border border-offme-border bg-offme-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-offme-accent"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="mt-3 rounded-full bg-offme-accent px-4 py-2 text-sm font-bold text-white hover:bg-offme-accentHover disabled:opacity-50"
        >
          {creating ? 'Criando...' : 'Criar comunidade'}
        </button>
      </form>

      {isLoading && <p className="px-4 py-8 text-offme-muted">Carregando...</p>}
      {!isLoading && communities.length === 0 && (
        <p className="px-4 py-8 text-center text-offme-muted">Nenhuma comunidade ainda.</p>
      )}
      {communities.map((community) => (
        <Link
          key={community.id}
          href={`/communities/${community.slug}`}
          className="block border-b border-offme-border px-4 py-4 hover:bg-black/[0.02]"
        >
          <p className="font-bold">{community.name}</p>
          <p className="text-sm text-offme-muted">
            @{community.slug} · {community.memberCount} membros
          </p>
        </Link>
      ))}
    </div>
  );
}