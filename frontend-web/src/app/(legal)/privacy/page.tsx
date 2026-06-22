import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — OffMe',
};

export default function PrivacyPage() {
  return (
    <article className="prose-offme">
      <h1 className="text-3xl font-extrabold">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-offme-muted">Última atualização: junho de 2026</p>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed text-offme-text">
        <p>
          O OffMe respeita sua privacidade. Esta política explica quais dados coletamos, como os
          usamos e quais escolhas você tem.
        </p>

        <h2 className="text-xl font-bold">1. Dados que coletamos</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Informações de cadastro: nome, nome de usuário, e-mail e senha (armazenada de forma segura).</li>
          <li>Conteúdo que você publica: posts, imagens, mensagens e interações.</li>
          <li>Dados de uso: páginas visitadas, cliques e informações técnicas do dispositivo.</li>
        </ul>

        <h2 className="text-xl font-bold">2. Como usamos seus dados</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Operar e melhorar o OffMe, incluindo feeds, notificações e busca.</li>
          <li>Proteger a plataforma contra spam, abuso e fraudes.</li>
          <li>Comunicar atualizações importantes sobre o serviço.</li>
        </ul>

        <h2 id="cookies" className="text-xl font-bold">3. Cookies</h2>
        <p>
          Utilizamos cookies e tecnologias semelhantes para manter sua sessão autenticada e lembrar
          preferências. Você pode gerenciar cookies nas configurações do navegador.
        </p>

        <h2 className="text-xl font-bold">4. Compartilhamento</h2>
        <p>
          Não vendemos seus dados pessoais. Podemos compartilhar informações com provedores de
          infraestrutura (hospedagem, armazenamento) apenas para operar o serviço, ou quando
          exigido por lei.
        </p>

        <h2 className="text-xl font-bold">5. Seus direitos</h2>
        <p>
          Você pode atualizar seu perfil, solicitar exclusão da conta ou pedir informações sobre o
          tratamento dos seus dados entrando em contato conosco.
        </p>

        <h2 className="text-xl font-bold">6. Segurança</h2>
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia
          em trânsito e controles de acesso.
        </p>

        <h2 className="text-xl font-bold">7. Contato</h2>
        <p>
          Para questões de privacidade, escreva para{' '}
          <a href="mailto:privacy@offme.app" className="text-offme-accent hover:underline">
            privacy@offme.app
          </a>
          .
        </p>
      </section>
    </article>
  );
}