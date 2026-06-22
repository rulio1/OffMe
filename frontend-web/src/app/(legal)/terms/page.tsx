import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Serviço — OffMe',
};

export default function TermsPage() {
  return (
    <article className="prose-offme">
      <h1 className="text-3xl font-extrabold">Termos de Serviço</h1>
      <p className="mt-2 text-sm text-offme-muted">Última atualização: junho de 2026</p>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed text-offme-text">
        <p>
          Bem-vindo ao OffMe. Ao criar uma conta ou usar nossos serviços, você concorda com estes
          Termos de Serviço. Leia com atenção antes de continuar.
        </p>

        <h2 className="text-xl font-bold">1. Uso do serviço</h2>
        <p>
          O OffMe é uma plataforma social para compartilhar textos, imagens e interações com outras
          pessoas. Você deve usar o serviço de forma legal, respeitosa e de acordo com as regras da
          comunidade.
        </p>

        <h2 className="text-xl font-bold">2. Sua conta</h2>
        <p>
          Você é responsável por manter a segurança da sua conta e por todas as atividades
          realizadas nela. Informe-nos imediatamente se suspeitar de acesso não autorizado.
        </p>

        <h2 className="text-xl font-bold">3. Conteúdo</h2>
        <p>
          Você mantém os direitos sobre o conteúdo que publica, mas nos concede licença para
          exibir, distribuir e promover esse conteúdo no OffMe. Não publique material ilegal,
          ofensivo, que viole direitos de terceiros ou que incentive violência ou discriminação.
        </p>

        <h2 className="text-xl font-bold">4. Moderação</h2>
        <p>
          Podemos remover conteúdo, suspender contas ou aplicar outras medidas quando houver
          violação destes termos ou denúncias fundamentadas de abuso, spam ou conduta inadequada.
        </p>

        <h2 className="text-xl font-bold">5. Privacidade</h2>
        <p>
          O tratamento dos seus dados pessoais é descrito na nossa{' '}
          <a href="/privacy" className="text-offme-accent hover:underline">
            Política de Privacidade
          </a>
          .
        </p>

        <h2 className="text-xl font-bold">6. Alterações</h2>
        <p>
          Podemos atualizar estes termos periodicamente. O uso continuado do OffMe após alterações
          significa que você aceita a versão revisada.
        </p>

        <h2 className="text-xl font-bold">7. Contato</h2>
        <p>
          Dúvidas sobre estes termos podem ser enviadas para{' '}
          <a href="mailto:legal@offme.app" className="text-offme-accent hover:underline">
            legal@offme.app
          </a>
          .
        </p>
      </section>
    </article>
  );
}