import { OffMeLogo } from './OffMeLogo';

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — branding */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-pulse-accent lg:flex">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-10 h-96 w-96 rounded-full bg-black/20 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md px-12 text-white">
          <OffMeLogo size="lg" className="!text-white [&_span:first-child]:text-white [&_span:last-child]:text-white/90" />
          <p className="mt-6 text-3xl font-bold leading-tight">
            Desconecte do ruído.<br />Conecte com o que importa.
          </p>
          <p className="mt-4 text-lg text-white/80">
            Sua rede social. Seu ritmo. Sem algoritmo te empurrando.
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <OffMeLogo size="md" />
          </div>

          <h1 className="text-3xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-2 text-pulse-muted">{subtitle}</p>}

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}