import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const RELEASES = [
  {
    version: 'Jun 2026',
    title: 'Social + perfil',
    items: [
      '@menções clicáveis e notificações quando alguém te marca',
      '#hashtags clicáveis com busca em Explorar',
      'Listas de seguidores e seguindo no perfil',
      'Fixar um post no topo do seu perfil',
    ],
  },
  {
    version: 'Jun 2026',
    title: 'Beta & crescimento',
    items: [
      'Feedback beta, banner e painel admin',
      'Onboarding com checklist no feed',
      'Contas demo e convites com ?ref=username',
      'Resumo semanal por email',
    ],
  },
  {
    version: 'MVP',
    title: 'Core',
    items: [
      'Feed Para você / Seguindo, DMs, comunidades, listas',
      'Polls, agendamento, dark mode, push web',
      'Moderação, verificação, recuperação de senha',
    ],
  },
];

export default function WhatsNewPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <Link href="/" className="rounded-full p-2 hover:bg-offme-hover" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Novidades</h1>
      </header>

      <div className="px-4 py-6">
        <p className="text-[15px] text-offme-muted">
          O que mudou no OffMe durante o beta. Envie ideias em{' '}
          <Link href="/settings/feedback" className="font-bold text-offme-accent hover:underline">
            Feedback beta
          </Link>
          .
        </p>

        <div className="mt-8 space-y-8">
          {RELEASES.map((release) => (
            <section key={release.title}>
              <p className="text-sm font-bold text-offme-accent">{release.version}</p>
              <h2 className="mt-1 text-lg font-extrabold">{release.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] text-offme-text">
                {release.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}