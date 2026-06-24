import Link from 'next/link';
import { OffMeLogo } from '@/components/auth/OffMeLogo';
import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';
import { classNames } from '@/styles/design-system';

const FEATURES = [
  {
    title: 'Feed inteligente',
    description: 'Para você e Seguindo, com ranking e descoberta de conteúdo.',
    icon: '🎯',
  },
  {
    title: 'Conversas diretas',
    description: 'Mensagens privadas com notificações em tempo real.',
    icon: '💬',
  },
  {
    title: 'Comunidades e listas',
    description: 'Organize quem você segue e participe de espaços temáticos.',
    icon: '👥',
  },
];

export function EnhancedWelcomeView() {
  const [theme] = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [showThemeToggle, setShowThemeToggle] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Show theme toggle after initial load
    const timer = setTimeout(() => {
      setShowThemeToggle(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-dvh bg-offme-bg">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse">
            <OffMeLogo size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-offme-bg">
      {/* Header with theme-aware styling */}
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="animate-fade-in-left">
          <OffMeLogo size="sm" />
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-full border border-offme-border px-4 py-2 text-[15px] font-bold transition-all duration-200 hover:bg-offme-hover hover:scale-105 active:scale-95"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="offme-btn-primary px-5 py-2 text-[15px] transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Criar conta
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 md:px-8 md:pt-16">
        {/* Hero Section with improved visual hierarchy */}
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div className="animate-fade-in">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-offme-accent/30 bg-offme-accent/10 px-4 py-1.5 text-sm font-bold text-offme-accent">
                <span className="h-2 w-2 rounded-full bg-offme-accent" aria-hidden />
                Beta aberto — participe e ajude a moldar o OffMe
              </p>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl animate-fade-in">
              Desconecte do{' '}
              <span className="relative inline-block">
                ruído
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-offme-accent/30 animate-underline-expand" />
              </span>
              <br />
              <span className="block text-offme-accent">
                Conecte com o que importa.
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-offme-accent/50 animate-underline-expand-delayed" />
              </span>
            </h1>

            <p className="mt-6 text-lg text-offme-muted md:text-xl animate-fade-in">
              OffMe é uma rede social focada em conversas reais — sem distrações,
              com controle sobre quem você segue e o que aparece no seu feed.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 animate-fade-in">
              <Link
                href="/signup"
                className="offme-btn-primary px-8 py-3 text-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Entrar no beta
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-offme-border px-8 py-3 text-lg font-bold transition-all duration-200 hover:bg-offme-hover hover:scale-105 active:scale-95"
              >
                Já tenho conta
              </Link>
            </div>

            <p className="mt-4 text-sm text-offme-muted animate-fade-in">
              Testadores podem enviar feedback em Configurações → Feedback beta após criar conta.
            </p>
          </div>

          {/* Features Card with enhanced design */}
          <div className="rounded-3xl border border-offme-border bg-offme-surface p-6 md:p-8 animate-fade-in-up transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
            <OffMeLogo size="lg" className="mb-6" />
            <ul className="space-y-5">
              {FEATURES.map((feature, index) => (
                <li key={feature.title} className="flex items-start gap-3 animate-fade-in-sequential">
                  <span className="text-xl">{feature.icon}</span>
                  <div>
                    <p className="font-bold">{feature.title}</p>
                    <p className="mt-1 text-[15px] text-offme-muted">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Enhanced Features Section */}
        <section className="mt-20 grid gap-6 md:grid-cols-3 animate-fade-in-up">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-offme-border p-6 transition-all duration-300 hover:bg-offme-hover hover:-translate-y-1 hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 text-3xl">{feature.icon}</div>
              <h2 className="text-lg font-bold">{feature.title}</h2>
              <p className="mt-2 text-[15px] text-offme-muted">{feature.description}</p>
            </article>
          ))}
        </section>

        {/* Theme Toggle Section */}
        {showThemeToggle && (
          <section className="mt-16 text-center animate-fade-in-slow">
            <p className="mb-4 text-sm font-semibold text-offme-muted uppercase tracking-wider">
              Experimente o tema {theme === 'dark' ? 'claro' : 'escuro'}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const newTheme = theme === 'light' ? 'dark' : 'light';
                  localStorage.setItem('offme-theme', newTheme);
                  window.location.reload();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-offme-border px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-offme-hover hover:scale-105 active:scale-95"
              >
                {theme === 'light' ? '🌙' : '☀️'}
                Alternar tema
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Footer with enhanced styling */}
      <footer className="border-t border-offme-border px-4 py-8 text-center text-sm text-offme-muted animate-fade-in-slow">
        <p>
          <Link href="/about" className="hover:underline">
            Sobre
          </Link>
          {' · '}
          <Link href="/terms" className="hover:underline">
            Termos
          </Link>
          {' · '}
          <Link href="/privacy" className="hover:underline">
            Privacidade
          </Link>
        </p>
        <p className="mt-2">© 2026 OffMe</p>
      </footer>
    </div>
  );
}