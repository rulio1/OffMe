'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { deactivateAccount, logout } from '@/lib/api';
import { clearSession, getStoredUser } from '@/lib/auth';
import { SettingsShell } from './SettingsShell';

export function AccountSettingsView() {
  const router = useRouter();
  const user = getStoredUser();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    await logout();
    clearSession();
    router.push('/login');
    router.refresh();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Excluir sua conta? Essa ação é permanente e não pode ser desfeita.'
    );
    if (!confirmed) return;

    setBusy(true);
    setError('');
    try {
      await deactivateAccount();
      clearSession();
      router.push('/welcome');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conta');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsShell title="Conta" description="Gerencie login e dados da conta">
      <div className="rounded-2xl border border-offme-border p-4">
        <p className="font-bold">{user?.displayName ?? 'Usuário'}</p>
        <p className="text-[15px] text-offme-muted">@{user?.username ?? 'usuario'}</p>
        <Link
          href="/profile"
          className="mt-3 inline-block text-[15px] font-bold text-offme-accent hover:underline"
        >
          Editar perfil
        </Link>
      </div>

      <button
        type="button"
        onClick={() => void handleLogout()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-offme-border py-3 font-bold transition-colors hover:bg-offme-hover"
      >
        <LogOut className="h-5 w-5" />
        Sair da conta
      </button>

      <div className="mt-8 rounded-2xl border border-red-500/30 p-4">
        <h2 className="font-bold text-red-500">Zona de perigo</h2>
        <p className="mt-2 text-[15px] text-offme-muted">
          Ao excluir a conta, seu perfil deixa de aparecer no OffMe. Posts publicados podem
          permanecer visíveis.
        </p>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={busy}
          className="mt-4 rounded-full bg-red-500 px-5 py-2 font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          {busy ? 'Excluindo...' : 'Excluir conta'}
        </button>
      </div>
    </SettingsShell>
  );
}