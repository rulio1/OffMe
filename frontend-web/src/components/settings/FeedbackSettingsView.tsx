'use client';

import { useState } from 'react';
import { SettingsShell } from './SettingsShell';
import { submitFeedback, type FeedbackCategory } from '@/lib/api';

const CATEGORIES: { value: FeedbackCategory; label: string; hint: string }[] = [
  { value: 'bug', label: 'Bug', hint: 'Algo quebrou ou não funciona como esperado' },
  { value: 'idea', label: 'Ideia', hint: 'Sugestão de melhoria ou nova funcionalidade' },
  { value: 'general', label: 'Geral', hint: 'Comentário, elogio ou outra observação' },
];

export function FeedbackSettingsView() {
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canSubmit = !submitting && message.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await submitFeedback({
        category,
        message: message.trim(),
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      });
      setMessage('');
      setSuccess('Obrigado! Seu feedback foi recebido.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SettingsShell
      title="Feedback beta"
      description="Ajude a melhorar o OffMe durante o período de testes"
    >
      <div className="rounded-2xl bg-offme-surface p-4">
        <p className="text-sm text-offme-muted">
          Estamos em beta aberto e cada mensagem conta. Bugs, ideias e impressões gerais são
          bem-vindos — lemos tudo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <fieldset>
          <legend className="text-sm font-bold">Categoria</legend>
          <div className="mt-2 space-y-2">
            {CATEGORIES.map((item) => (
              <label
                key={item.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-offme-border p-3 transition-colors has-[:checked]:border-offme-accent has-[:checked]:bg-offme-accent/5"
              >
                <input
                  type="radio"
                  name="feedback-category"
                  value={item.value}
                  checked={category === item.value}
                  onChange={() => setCategory(item.value)}
                  className="mt-1 accent-offme-accent"
                />
                <span>
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span className="block text-xs text-offme-muted">{item.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="feedback-message" className="text-sm font-bold">
            Mensagem
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="Descreva o que aconteceu, o que você esperava ou sua sugestão..."
            className="mt-2 w-full resize-none rounded-xl border border-offme-border bg-offme-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-offme-accent"
          />
          <p className="mt-1 text-xs text-offme-muted">
            {message.length}/2000 · mínimo 5 caracteres
          </p>
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
          {submitting ? 'Enviando...' : 'Enviar feedback'}
        </button>
      </form>
    </SettingsShell>
  );
}