import Link from 'next/link';
import { OffMeLogo } from '@/components/auth/OffMeLogo';

const FEATURES = [
  {
    title: 'Feed inteligente',
    description: 'Para você e Seguindo, com ranking e descoberta de conteúdo.',
  },
  {
    title: 'Conversas diretas',
    description: 'Mensagens privadas com notificações em tempo real.',
  },
  {
    title: 'Comunidades e listas',
    description: 'Organize quem você segue e participe de espaços temáticos.',
  },
];

export function WelcomeView() {
  return (
    <div className="min-h-dvh bg-offme-bg">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <OffMeLogo size="sm" />
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-full border border-offme-border px-4 py-2 text-[15px] font-bold transition-colors hover:bg-offme-hover"
          >
            Entrar
          </Link>
          <Link href="/signup" className="offme-btn-primary px-5 py-2 text-[15px]">
            Criar conta
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 md:px-8 md:pt-16">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-offme-accent/30 bg-offme-accent/10 px-4 py-1.5 text-sm font-bold text-offme-accent">
              <span className="h-2 w-2 rounded-full bg-offme-accent" aria-hidden />
              Beta aberto — participe e ajude a moldar o OffMe
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Desconecte do ruído.
              <span className="block text-offme-accent">Conecte com o que importa.</span>
            </h1>
            <p className="mt-6 text-lg text-offme-muted md:text-xl">
              OffMe é uma rede social focada em conversas reais — sem distrações, com controle
              sobre quem você segue e o que aparece no seu feed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="offme-btn-primary px-8 py-3 text-lg">
                Entrar no beta
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-offme-border px-8 py-3 text-lg font-bold transition-colors hover:bg-offme-hover"
              >
                Já tenho conta
              </Link>
            </div>
            <p className="mt-4 text-sm text-offme-muted">
              Testadores podem enviar feedback em Configurações → Feedback beta após criar conta.
            </p>
          </div>

          <div className="rounded-3xl border border-offme-border bg-offme-surface p-6 md:p-8">
            <OffMeLogo size="lg" className="mb-6" />
            <ul className="space-y-5">
              {FEATURES.map((feature) => (
                <li key={feature.title}>
                  <p className="font-bold">{feature.title}</p>
                  <p className="mt-1 text-[15px] text-offme-muted">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-20 grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-offme-border p-6 transition-colors hover:bg-offme-hover"
            >
              <h2 className="text-lg font-bold">{feature.title}</h2>
              <p className="mt-2 text-[15px] text-offme-muted">{feature.description}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-offme-border px-4 py-8 text-center text-sm text-offme-muted">
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