import Link from 'next/link';
import { OffMeLogo } from './OffMeLogo';

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  mode?: 'login' | 'signup';
}

export function AuthShell({ children, title, subtitle, mode = 'login' }: AuthShellProps) {
  const alternateHref = mode === 'login' ? '/signup' : '/login';
  const alternateLabel = mode === 'login' ? 'Criar conta' : 'Entrar';
  const alternatePrompt = mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?';

  return (
    <div className="flex min-h-screen bg-offme-bg">
      {/* Painel esquerdo — estilo X */}
      <div className="relative hidden flex-1 items-center justify-center px-12 lg:flex">
        <div className="max-w-[560px]">
          <OffMeLogo size="xl" className="mb-12" />
          <h2 className="text-[64px] font-extrabold leading-[1.1] tracking-tight">
            Está acontecendo agora
          </h2>
          <p className="mt-8 text-[31px] font-bold leading-snug text-offme-text">
            Participe hoje.
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 flex-col lg:max-w-[600px] lg:border-l lg:border-offme-border">
        <div
          className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-20"
          style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mb-10 lg:mb-12">
            <OffMeLogo size="md" className="lg:hidden" />
          </div>

          <OffMeLogo size="sm" className="mb-8 hidden lg:block" />

          <h1 className="text-[31px] font-extrabold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-3 text-[15px] text-offme-muted">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          <p className="mt-10 text-[15px] text-offme-muted">
            {alternatePrompt}{' '}
            <Link
              href={alternateHref}
              className="text-offme-accent hover:underline"
            >
              {alternateLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}