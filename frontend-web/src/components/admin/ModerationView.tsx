'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  fetchAdminFeedback,
  fetchAdminReports,
  fetchAdminVerificationRequests,
  downloadAdminFeedbackCsv,
  reviewVerificationRequest,
  suspendAdminUser,
  unsuspendAdminUser,
  updateAdminFeedback,
  updateAdminReport,
  type FeedbackStatus,
} from '@/lib/api';
import { formatPostTime } from '@/lib/format-time';

type AdminTab = 'reports' | 'verification' | 'feedback';

const FEEDBACK_LABELS: Record<string, string> = {
  bug: 'Bug',
  idea: 'Ideia',
  general: 'Geral',
};

export function ModerationView() {
  const [tab, setTab] = useState<AdminTab>('reports');
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackStatus | 'all'>('open');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const {
    data: reportsData,
    mutate: mutateReports,
    error: reportsError,
  } = useSWR('admin-reports', fetchAdminReports, { revalidateOnFocus: false });

  const {
    data: verificationData,
    mutate: mutateVerification,
    error: verificationError,
  } = useSWR('admin-verification', fetchAdminVerificationRequests, {
    revalidateOnFocus: false,
  });

  const {
    data: feedbackData,
    mutate: mutateFeedback,
    error: feedbackError,
  } = useSWR(
    tab === 'feedback' ? `admin-feedback-${feedbackFilter}` : null,
    () => fetchAdminFeedback(50, feedbackFilter === 'all' ? undefined : feedbackFilter),
    { revalidateOnFocus: false }
  );

  const reports = reportsData?.reports ?? [];
  const verificationRequests = verificationData?.requests ?? [];
  const feedbackItems = feedbackData?.feedback ?? [];
  const accessDenied =
    reportsError?.message?.includes('negado') ||
    verificationError?.message?.includes('negado') ||
    feedbackError?.message?.includes('negado');

  const handleReportAction = async (reportId: number, action: 'resolve' | 'dismiss') => {
    setBusyId(reportId);
    setActionError('');
    try {
      await updateAdminReport(reportId, action);
      await mutateReports();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar denúncia');
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspendUser = async (userId: number) => {
    const reason = window.prompt('Motivo da suspensão:', 'Violação das regras');
    if (!reason?.trim()) return;
    setBusyId(userId);
    setActionError('');
    try {
      await suspendAdminUser(userId, reason.trim());
      await mutateReports();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao suspender usuário');
    } finally {
      setBusyId(null);
    }
  };

  const handleUnsuspendUser = async (userId: number) => {
    if (!window.confirm('Reativar este usuário?')) return;
    setBusyId(userId);
    setActionError('');
    try {
      await unsuspendAdminUser(userId);
      await mutateReports();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao reativar usuário');
    } finally {
      setBusyId(null);
    }
  };

  const handleFeedbackAction = async (id: number, status: FeedbackStatus) => {
    setBusyId(id);
    setActionError('');
    try {
      await updateAdminFeedback(id, status);
      await mutateFeedback();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar feedback');
    } finally {
      setBusyId(null);
    }
  };

  const handleVerificationAction = async (requestId: number, action: 'approve' | 'reject') => {
    setBusyId(requestId);
    setActionError('');
    try {
      await reviewVerificationRequest(requestId, action);
      await mutateVerification();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao revisar solicitação');
    } finally {
      setBusyId(null);
    }
  };

  if (accessDenied) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-lg font-bold">Acesso negado</p>
        <p className="mt-2 text-sm text-offme-muted">
          Esta área é restrita a administradores.
        </p>
        <Link href="/" className="mt-4 inline-block text-offme-accent hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">Moderação</h1>
        <div className="mt-3 flex gap-6">
          {(
            [
              ['reports', 'Denúncias'],
              ['verification', 'Verificação'],
              ['feedback', 'Beta'],
            ] as const
          ).map(([item, label]) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={
                tab === item
                  ? 'border-b-4 border-offme-accent pb-3 font-bold'
                  : 'pb-3 text-offme-muted hover:text-offme-text'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {actionError && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError}
        </p>
      )}

      {tab === 'reports' && (
        <div>
          {reports.length === 0 && (
            <p className="px-4 py-8 text-center text-offme-muted">Nenhuma denúncia aberta.</p>
          )}
          {reports.map((report) => (
            <div key={report.id} className="border-b border-offme-border px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-offme-muted">
                    #{report.id} · {formatPostTime(report.createdAt)} · {report.reason}
                  </p>
                  <p className="mt-1 text-sm">
                    Denunciado por{' '}
                    <span className="font-bold">@{report.reporterUsername}</span>
                  </p>
                  {report.targetType === 'post' && (
                    <>
                      <p className="mt-1 text-sm text-offme-muted">
                        Post de @{report.postAuthorUsername ?? 'usuário'} · ID {report.targetId}
                      </p>
                      {report.postText && (
                        <p className="mt-2 line-clamp-3 rounded-xl bg-offme-surface p-3 text-sm">
                          {report.postText}
                        </p>
                      )}
                      <Link
                        href={`/post/${report.targetId}`}
                        className="mt-2 inline-block text-sm text-offme-accent hover:underline"
                      >
                        Ver post
                      </Link>
                    </>
                  )}
                  {report.targetType === 'user' && (
                    <>
                      <p className="mt-1 text-sm">
                        Usuário denunciado:{' '}
                        <span className="font-bold">
                          {report.targetDisplayName ?? 'Usuário'} (@
                          {report.targetUsername ?? report.targetId})
                        </span>
                        {report.targetSuspended && (
                          <span className="ml-2 text-xs font-semibold text-red-500">
                            (suspenso)
                          </span>
                        )}
                      </p>
                      {report.targetUsername && (
                        <Link
                          href={`/profile/${report.targetUsername}`}
                          className="mt-2 inline-block text-sm text-offme-accent hover:underline"
                        >
                          Ver perfil
                        </Link>
                      )}
                    </>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {report.targetType === 'user' && !report.targetSuspended && (
                    <button
                      type="button"
                      onClick={() => handleSuspendUser(report.targetId)}
                      disabled={busyId === report.targetId}
                      className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      Suspender
                    </button>
                  )}
                  {report.targetType === 'user' && report.targetSuspended && (
                    <button
                      type="button"
                      onClick={() => handleUnsuspendUser(report.targetId)}
                      disabled={busyId === report.targetId}
                      className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Reativar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleReportAction(report.id, 'resolve')}
                    disabled={busyId === report.id}
                    className="rounded-full bg-offme-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-offme-accentHover disabled:opacity-50"
                  >
                    Resolver
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportAction(report.id, 'dismiss')}
                    disabled={busyId === report.id}
                    className="rounded-full border border-offme-border px-3 py-1.5 text-xs font-semibold hover:bg-offme-hover disabled:opacity-50"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'feedback' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-offme-border px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['open', 'Abertos'],
                  ['resolved', 'Resolvidos'],
                  ['dismissed', 'Dispensados'],
                  ['all', 'Todos'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFeedbackFilter(value)}
                  className={
                    feedbackFilter === value
                      ? 'rounded-full bg-offme-accent px-3 py-1 text-xs font-bold text-white'
                      : 'rounded-full border border-offme-border px-3 py-1 text-xs font-semibold hover:bg-offme-hover'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                void downloadAdminFeedbackCsv(
                  feedbackFilter === 'all' ? undefined : feedbackFilter
                ).catch((err) =>
                  setActionError(err instanceof Error ? err.message : 'Erro ao exportar')
                )
              }
              className="text-sm font-bold text-offme-accent hover:underline"
            >
              Exportar CSV
            </button>
          </div>
          {feedbackItems.length === 0 && (
            <p className="px-4 py-8 text-center text-offme-muted">Nenhum feedback neste filtro.</p>
          )}
          {feedbackItems.map((item) => (
            <div key={item.id} className="border-b border-offme-border px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-offme-muted">
                    #{item.id} · {FEEDBACK_LABELS[item.category] ?? item.category} ·{' '}
                    {formatPostTime(item.createdAt)} · {item.status}
                  </p>
                  {item.username ? (
                    <p className="mt-1 text-sm">
                      De{' '}
                      <Link
                        href={`/profile/${item.username}`}
                        className="font-bold text-offme-accent hover:underline"
                      >
                        {item.displayName ?? item.username} (@{item.username})
                      </Link>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-offme-muted">Anônimo / sem login</p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-offme-surface p-3 text-sm">
                    {item.message}
                  </p>
                  {item.pageUrl && (
                    <a
                      href={item.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-offme-accent hover:underline"
                    >
                      Ver página
                    </a>
                  )}
                </div>
                {item.status === 'open' && (
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleFeedbackAction(item.id, 'resolved')}
                      disabled={busyId === item.id}
                      className="rounded-full bg-offme-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-offme-accentHover disabled:opacity-50"
                    >
                      Resolver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedbackAction(item.id, 'dismissed')}
                      disabled={busyId === item.id}
                      className="rounded-full border border-offme-border px-3 py-1.5 text-xs font-semibold hover:bg-offme-hover disabled:opacity-50"
                    >
                      Dispensar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'verification' && (
        <div>
          {verificationRequests.length === 0 && (
            <p className="px-4 py-8 text-center text-offme-muted">
              Nenhuma solicitação de verificação pendente.
            </p>
          )}
          {verificationRequests.map((req) => (
            <div key={req.id} className="border-b border-offme-border px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {req.displayName}{' '}
                    <span className="font-normal text-offme-muted">@{req.username}</span>
                  </p>
                  <p className="mt-1 text-xs text-offme-muted">
                    Solicitado em {formatPostTime(req.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-offme-surface p-3 text-sm">
                    {req.reason}
                  </p>
                  <Link
                    href={`/profile/${req.username}`}
                    className="mt-2 inline-block text-sm text-offme-accent hover:underline"
                  >
                    Ver perfil
                  </Link>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerificationAction(req.id, 'approve')}
                    disabled={busyId === req.id}
                    className="rounded-full bg-offme-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-offme-accentHover disabled:opacity-50"
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerificationAction(req.id, 'reject')}
                    disabled={busyId === req.id}
                    className="rounded-full border border-offme-border px-3 py-1.5 text-xs font-semibold hover:bg-offme-hover disabled:opacity-50"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}