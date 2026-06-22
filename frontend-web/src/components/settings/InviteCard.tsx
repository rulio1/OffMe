'use client';

import { useState } from 'react';
import { getStoredUser } from '@/lib/auth';
import { getSiteUrl } from '@/lib/site';

export function InviteCard() {
  const user = getStoredUser();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const inviteUrl = `${getSiteUrl()}/signup?ref=${encodeURIComponent(user.username)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-offme-border p-4">
      <p className="font-bold">Convidar amigos</p>
      <p className="mt-1 text-[15px] text-offme-muted">
        Compartilhe seu link — novos cadastros aparecem como convidados por você.
      </p>
      <p className="mt-3 break-all rounded-xl bg-offme-surface px-3 py-2 text-sm text-offme-muted">
        {inviteUrl}
      </p>
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-3 rounded-full border border-offme-border px-4 py-2 text-[13px] font-bold hover:bg-offme-hover"
      >
        {copied ? 'Copiado!' : 'Copiar link'}
      </button>
    </div>
  );
}