'use client';

import { useEffect, useState } from 'react';
import { SettingsShell } from './SettingsShell';
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '@/lib/push-client';

export function NotificationsSettingsView() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const ok = isPushSupported();
    setSupported(ok);
    if (!ok) return;

    void navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setEnabled(!!sub && Notification.permission === 'granted');
    });
  }, []);

  const handleToggle = async () => {
    setMessage('');
    setBusy(true);
    try {
      if (enabled) {
        await unsubscribeFromPush();
        setEnabled(false);
        setMessage('Notificações push desativadas.');
      } else {
        const ok = await subscribeToPush();
        setEnabled(ok);
        setMessage(ok ? 'Notificações push ativadas.' : 'Permissão negada ou push indisponível.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao alterar notificações');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsShell title="Notificações" description="Escolha como quer ser avisado">
      <div className="rounded-2xl border border-offme-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold">Push no navegador</p>
            <p className="mt-1 text-[15px] text-offme-muted">
              Curtidas, respostas, menções e mensagens diretas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleToggle()}
            disabled={!supported || busy}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              enabled ? 'bg-offme-accent' : 'bg-offme-border'
            } disabled:opacity-50`}
            aria-pressed={enabled}
            aria-label="Alternar notificações push"
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {!supported && (
          <p className="mt-4 text-sm text-offme-muted">
            Seu navegador não suporta notificações push. No iPhone, instale o OffMe na tela de início
            via Safari.
          </p>
        )}
        {message && <p className="mt-4 text-sm text-offme-accent">{message}</p>}
      </div>

      <p className="mt-6 text-[15px] text-offme-muted">
        Notificações dentro do app (tempo real) continuam ativas enquanto você estiver logado.
      </p>
    </SettingsShell>
  );
}