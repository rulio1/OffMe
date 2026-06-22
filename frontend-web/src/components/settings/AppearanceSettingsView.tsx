'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { SettingsShell } from './SettingsShell';
import { applyTheme, getStoredTheme, setStoredTheme, type ThemeMode } from '@/lib/theme';

const OPTIONS: { id: ThemeMode; label: string; description: string }[] = [
  { id: 'light', label: 'Claro', description: 'Fundo branco, texto escuro' },
  { id: 'dark', label: 'Escuro', description: 'Fundo preto, texto claro' },
  { id: 'system', label: 'Sistema', description: 'Segue as configurações do dispositivo' },
];

export function AppearanceSettingsView() {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    setMode(getStoredTheme());
  }, []);

  const select = (next: ThemeMode) => {
    setMode(next);
    setStoredTheme(next);
    applyTheme(next);
  };

  return (
    <SettingsShell title="Aparência" description="Personalize o visual do OffMe">
      <div className="space-y-3">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => select(option.id)}
            className={clsx(
              'flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors',
              mode === option.id
                ? 'border-offme-accent bg-offme-accent/5'
                : 'border-offme-border hover:bg-offme-hover'
            )}
          >
            <div>
              <p className="font-bold">{option.label}</p>
              <p className="mt-0.5 text-[15px] text-offme-muted">{option.description}</p>
            </div>
            <span
              className={clsx(
                'h-4 w-4 rounded-full border-2',
                mode === option.id ? 'border-offme-accent bg-offme-accent' : 'border-offme-border'
              )}
            />
          </button>
        ))}
      </div>
    </SettingsShell>
  );
}