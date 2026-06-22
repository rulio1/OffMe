'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { VerifiedBadge } from '@/components/user/VerifiedBadge';
import { SettingsShell } from './SettingsShell';
import { fetchVerificationStatus, submitVerificationRequest } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { formatPostTime } from '@/lib/format-time';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

export function VerificationSettingsView() {
  const user = getStoredUser();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data, mutate, isLoading } = useSWR('verification-status', fetchVerificationStatus, {
    revalidateOnFocus: false,
  });

  const request = data?.request ?? null;
  const isVerified = data?.verified ?? user?.verified;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await submitVerificationRequest(reason.trim());
      setReason('');
      setSuccess('Solicitação enviada com sucesso.');
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !submitting &&
    reason.trim().length >= 10 &&
    !isVerified &&
    request?.status !== 'pending';

  return (
    <SettingsShell title="Verificação" description="Solicite o selo de verificação para sua conta">
        <div className="rounded-2xl bg-offme-surface p-4">
          <p className="font-bold">
            {user?.displayName ?? 'Usuário'}
            {isVerified && <VerifiedBadge className="ml-1 inline-block" />}
          </p>
          <p className="text-sm text-offme-muted">@{user?.username ?? 'usuario'}</p>
          {isVerified ? (
            <p className="mt-3 text-sm text-offme-text">
              Sua conta já está verificada.
            </p>
          ) : (
            <p className="mt-3 text-sm text-offme-muted">
              Contas verificadas recebem um selo que indica autenticidade do perfil.
            </p>
          )}
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-offme-muted">Carregando...</p>
        )}

        {!isLoading && request && (
          <div className="mt-6 rounded-2xl border border-offme-border p-4">
            <p className="text-sm font-bold">Última solicitação</p>
            <p className="mt-1 text-sm text-offme-muted">
              Status: {STATUS_LABELS[request.status] ?? request.status} ·{' '}
              {formatPostTime(request.createdAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{request.reason}</p>
          </div>
        )}

        {!isVerified && request?.status !== 'pending' && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="verification-reason" className="text-sm font-bold">
                Por que você deve ser verificado?
              </label>
              <textarea
                id="verification-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                maxLength={500}
                placeholder="Explique sua relevância pública, marca ou motivo para verificação..."
                className="mt-2 w-full resize-none rounded-xl border border-offme-border bg-offme-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-offme-accent"
              />
              <p className="mt-1 text-xs text-offme-muted">{reason.length}/500</p>
            </div>

            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-600" role="status">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-full bg-offme-accent px-6 py-2.5 font-bold text-white hover:bg-offme-accentHover disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </form>
        )}

        {!isVerified && request?.status === 'pending' && (
          <p className="mt-6 text-sm text-offme-muted">
            Sua solicitação está em análise. Você será notificado quando houver uma decisão.
          </p>
        )}

    </SettingsShell>
  );
}