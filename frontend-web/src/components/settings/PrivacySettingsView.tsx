'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  fetchBlockedUsers,
  fetchMutedUsers,
  unblockUser,
  unmuteUser,
} from '@/lib/api';
import { UserAvatar } from '@/components/user/UserAvatar';
import { SettingsShell } from './SettingsShell';

function UserList({
  users,
  emptyLabel,
  actionLabel,
  onAction,
  busyUsername,
}: {
  users: Array<{ id: number; username: string; displayName: string; avatarUrl?: string }>;
  emptyLabel: string;
  actionLabel: string;
  onAction: (username: string) => Promise<void>;
  busyUsername: string | null;
}) {
  if (users.length === 0) {
    return <p className="py-8 text-center text-offme-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-offme-border">
      {users.map((user) => (
        <li key={user.id} className="flex items-center gap-3 py-3">
          <Link href={`/profile/${user.username}`} className="shrink-0">
            <UserAvatar url={user.avatarUrl} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/profile/${user.username}`} className="block truncate font-bold hover:underline">
              {user.displayName}
            </Link>
            <p className="truncate text-[15px] text-offme-muted">@{user.username}</p>
          </div>
          <button
            type="button"
            onClick={() => void onAction(user.username)}
            disabled={busyUsername === user.username}
            className="shrink-0 rounded-full border border-offme-border px-3 py-1.5 text-[13px] font-bold transition-colors hover:bg-offme-hover disabled:opacity-50"
          >
            {busyUsername === user.username ? '...' : actionLabel}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PrivacySettingsView() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: blockedData, mutate: mutateBlocked } = useSWR('blocked-users', fetchBlockedUsers);
  const { data: mutedData, mutate: mutateMuted } = useSWR('muted-users', fetchMutedUsers);

  const handleUnblock = async (username: string) => {
    setError('');
    setBusy(username);
    try {
      await unblockUser(username);
      await mutateBlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desbloquear');
    } finally {
      setBusy(null);
    }
  };

  const handleUnmute = async (username: string) => {
    setError('');
    setBusy(username);
    try {
      await unmuteUser(username);
      await mutateMuted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover silêncio');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SettingsShell title="Privacidade" description="Controle quem você vê e quem vê você">
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <section className="mb-8">
        <h2 className="text-lg font-bold">Bloqueados</h2>
        <p className="mt-1 text-[15px] text-offme-muted">
          Usuários bloqueados não podem ver seu perfil nem interagir com você.
        </p>
        <div className="mt-4 rounded-2xl border border-offme-border px-4">
          <UserList
            users={blockedData?.users ?? []}
            emptyLabel="Nenhum usuário bloqueado."
            actionLabel="Desbloquear"
            onAction={handleUnblock}
            busyUsername={busy}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Silenciados</h2>
        <p className="mt-1 text-[15px] text-offme-muted">
          Posts de contas silenciadas não aparecem no seu feed.
        </p>
        <div className="mt-4 rounded-2xl border border-offme-border px-4">
          <UserList
            users={mutedData?.users ?? []}
            emptyLabel="Nenhum usuário silenciado."
            actionLabel="Remover"
            onAction={handleUnmute}
            busyUsername={busy}
          />
        </div>
      </section>
    </SettingsShell>
  );
}