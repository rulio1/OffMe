'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { register } from '@/lib/api';
import { setSession } from '@/lib/auth';

const USERNAME_RE = /^[a-zA-Z0-9_]{1,15}$/;

export function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Informe seu nome de exibição');
      return;
    }
    if (!USERNAME_RE.test(username)) {
      setError('Usuário: 1–15 caracteres (letras, números e _)');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail válido');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const session = await register(username, email.trim(), password, displayName.trim());
      setSession(session);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-pulse-muted">
          Nome de exibição
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Seu nome"
          maxLength={50}
          className="w-full rounded-lg border border-pulse-border bg-pulse-surface px-4 py-3 text-pulse-text outline-none transition-colors placeholder:text-pulse-muted focus:border-pulse-accent"
        />
      </div>

      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-pulse-muted">
          Nome de usuário
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="seu_usuario"
          maxLength={15}
          className="w-full rounded-lg border border-pulse-border bg-pulse-surface px-4 py-3 text-pulse-text outline-none transition-colors placeholder:text-pulse-muted focus:border-pulse-accent"
        />
      </div>

      <div>
        <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-pulse-muted">
          E-mail
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className="w-full rounded-lg border border-pulse-border bg-pulse-surface px-4 py-3 text-pulse-text outline-none transition-colors placeholder:text-pulse-muted focus:border-pulse-accent"
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-pulse-muted">
          Senha
        </label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-lg border border-pulse-border bg-pulse-surface px-4 py-3 pr-12 text-pulse-text outline-none transition-colors placeholder:text-pulse-muted focus:border-pulse-accent"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-pulse-muted hover:text-pulse-text"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-pulse-muted">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repita a senha"
          className="w-full rounded-lg border border-pulse-border bg-pulse-surface px-4 py-3 text-pulse-text outline-none transition-colors placeholder:text-pulse-muted focus:border-pulse-accent"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-pulse-accent py-3 font-bold text-white transition-colors hover:bg-pulse-accentHover disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar conta'}
      </button>

      <p className="text-center text-pulse-muted">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-pulse-accent hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}