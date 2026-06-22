import Link from 'next/link';
import { OffMeLogo } from '@/components/auth/OffMeLogo';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-offme-bg">
      <header className="border-b border-offme-border px-4 py-4">
        <Link href="/" className="inline-flex rounded-full px-2 py-1 transition-colors hover:bg-offme-hover">
          <OffMeLogo size="sm" />
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">{children}</main>
      <footer className="border-t border-offme-border px-4 py-6 text-center text-sm text-offme-muted">
        <p>
          <Link href="/terms" className="hover:underline">
            Termos
          </Link>
          {' · '}
          <Link href="/privacy" className="hover:underline">
            Privacidade
          </Link>
          {' · '}
          <Link href="/about" className="hover:underline">
            Sobre
          </Link>
        </p>
        <p className="mt-2">© 2026 OffMe</p>
      </footer>
    </div>
  );
}