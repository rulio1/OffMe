'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { completeOnboarding, shouldShowOnboarding } from '@/lib/onboarding';

const STEPS = [
  {
    title: 'Bem-vindo ao OffMe',
    body: 'Um feed sem ruído — siga pessoas e publique o que importa para você.',
  },
  {
    title: 'Explore e conecte',
    body: 'Use Explorar para buscar pessoas e posts. Curta, responda e mande mensagens diretas.',
  },
  {
    title: 'Personalize',
    body: 'Em Configurações você controla privacidade, notificações, tema e posts agendados.',
    cta: { href: '/settings', label: 'Abrir configurações' },
  },
];

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setVisible(shouldShowOnboarding());
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function finish() {
    completeOnboarding();
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-2xl border border-offme-border bg-offme-bg p-6 shadow-xl"
        role="dialog"
        aria-labelledby="onboarding-title"
      >
        <p className="text-sm font-medium text-offme-accent">
          Passo {step + 1} de {STEPS.length}
        </p>
        <h2 id="onboarding-title" className="mt-2 text-xl font-bold">
          {current.title}
        </h2>
        <p className="mt-3 text-[15px] text-offme-muted">{current.body}</p>

        {current.cta && (
          <Link
            href={current.cta.href}
            onClick={finish}
            className="mt-4 inline-block text-[15px] font-bold text-offme-accent hover:underline"
          >
            {current.cta.label}
          </Link>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            className="text-[15px] text-offme-muted hover:text-offme-text"
          >
            Pular
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLast) finish();
              else setStep((s) => s + 1);
            }}
            className="offme-btn-primary px-6 py-2"
          >
            {isLast ? 'Começar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}