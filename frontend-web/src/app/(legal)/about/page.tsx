import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre — OffMe',
};

export default function AboutPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold">Sobre o OffMe</h1>
      <p className="mt-2 text-sm text-offme-muted">Desconecte do ruído. Conecte com o que importa.</p>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed text-offme-text">
        <p>
          O OffMe é uma rede social pensada para conversas mais significativas. Menos algoritmo
          barulhento, mais espaço para o que realmente importa — pessoas, ideias e comunidades.
        </p>

        <h2 className="text-xl font-bold">Nossa missão</h2>
        <p>
          Criar um ambiente digital onde você controla sua atenção, descobre conteúdo relevante e
          interage com respeito. Acreditamos em transparência, moderação justa e ferramentas simples
          para expressar-se.
        </p>

        <h2 className="text-xl font-bold">O que oferecemos</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Feed personalizado e timeline de quem você segue</li>
          <li>Posts com texto, imagens, enquetes e citações</li>
          <li>Mensagens diretas e notificações em tempo real</li>
          <li>Ferramentas de bloqueio, silenciamento e denúncia</li>
        </ul>

        <h2 className="text-xl font-bold">Comunidade</h2>
        <p>
          O OffMe cresce com a participação de cada pessoa. Denuncie conteúdo inadequado, siga as{' '}
          <Link href="/terms" className="text-offme-accent hover:underline">
            regras da plataforma
          </Link>{' '}
          e ajude a construir um espaço acolhedor para todos.
        </p>

        <div className="mt-8 rounded-2xl bg-offme-surface p-6">
          <p className="font-bold">Quer começar?</p>
          <p className="mt-2 text-offme-muted">
            Crie sua conta gratuitamente e junte-se à comunidade OffMe.
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-block rounded-full bg-offme-accent px-6 py-2.5 font-bold text-white transition-colors hover:bg-offme-accentHover"
          >
            Criar conta
          </Link>
        </div>
      </section>
    </article>
  );
}