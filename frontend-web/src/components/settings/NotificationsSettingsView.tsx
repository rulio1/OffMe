'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  fetchNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from '@/lib/api';
import { SettingsShell } from './SettingsShell';
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '@/lib/push-client';

const PREF_ITEMS: Array<{ key: keyof NotificationPrefs; label: string }> = [
  { key: 'pushLikes', label: 'Curtidas' },
  { key: 'pushReplies', label: 'Respostas' },
  { key: 'pushFollows', label: 'Novos seguidores' },
  { key: 'pushReposts', label: 'Reposts' },
  { key: 'pushQuotes', label: 'Citações' },
  { key: 'pushDm', label: 'Mensagens diretas' },
];

function Toggle({
  enabled,
  disabled,
  onToggle,
}: {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        enabled ? 'bg-offme-accent' : 'bg-offme-border'
      } disabled:opacity-50`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function NotificationsSettingsView() {
  const [supported, setSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const { data, mutate } = useSWR('notification-prefs', fetchNotificationPrefs);
  const prefs = data?.prefs;

  useEffect(() => {
    const ok = isPushSupported();
    setSupported(ok);
    if (!ok) return;
    void navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setPushEnabled(!!sub && Notification.permission === 'granted');
    });
  }, []);

  const handlePushToggle = async () => {
    setMessage('');
    setBusy(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
        setMessage('Push desativado.');
      } else {
        const ok = await subscribeToPush();
        setPushEnabled(ok);
        setMessage(ok ? 'Push ativado.' : 'Permissão negada ou indisponível.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao alterar push');
    } finally {
      setBusy(false);
    }
  };

  const handlePrefToggle = async (key: keyof NotificationPrefs) => {
    if (!prefs) return;
    setMessage('');
    try {
      await updateNotificationPrefs({ [key]: !prefs[key] });
      await mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  return (
    <SettingsShell title="Notificações" description="Escolha como quer ser avisado">
      <div className="rounded-2xl border border-offme-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold">Push no navegador</p>
            <p className="mt-1 text-[15px] text-offme-muted">Ative para receber alertas fora do app.</p>
          </div>
          <Toggle enabled={pushEnabled} disabled={!supported || busy} onToggle={() => void handlePushToggle()} />
        </div>
        {!supported && (
          <p className="mt-4 text-sm text-offme-muted">
            Push não suportado neste navegador. No iPhone, instale via Safari → Adicionar à Tela de Início.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-offme-border divide-y divide-offme-border">
        <p className="px-4 py-3 text-sm font-bold text-offme-muted">Tipos de push</p>
        {PREF_ITEMS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-[15px]">{label}</span>
            <Toggle
              enabled={prefs?.[key] ?? true}
              disabled={!prefs}
              onToggle={() => void handlePrefToggle(key)}
            />
          </div>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-offme-accent">{message}</p>}
      <p className="mt-6 text-[15px] text-offme-muted">
        Alertas in-app (tempo real) continuam ativos enquanto você estiver logado.
      </p>
    </SettingsShell>
  );
}