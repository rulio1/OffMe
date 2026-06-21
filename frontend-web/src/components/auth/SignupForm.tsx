'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { register } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { AuthField } from './AuthField';

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

  const canSubmit =
    displayName.trim() &&
    USERNAME_RE.test(username) &&
    email.trim().includes('@') &&
    password.length >= 8 &&
    password === confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      {error && (
        <p className="mb-4 text-[15px] text-red-400" role="alert">
          {error}
        </p>
      )}

      <AuthField
        id="displayName"
        name="displayName"
        type="text"
        label="Nome"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        maxLength={50}
      />

      <AuthField
        id="username"
        name="username"
        type="text"
        label="Nome de usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase())}
        maxLength={15}
      />

      <AuthField
        id="signup-email"
        name="email"
        type="email"
        autoComplete="email"
        label="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <AuthField
        id="signup-password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="rounded-full p-2 text-offme-muted transition-colors hover:bg-offme-accent/10 hover:text-offme-accent"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        }
      />

      <AuthField
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        label="Confirmar senha"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-offme-accent py-3.5 text-[17px] font-bold text-white transition-colors hover:bg-offme-accentHover disabled:cursor-default disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar conta'}
      </button>

      <p className="mt-4 text-[11px] leading-relaxed text-offme-muted">
        Ao se inscrever, você concorda com os{' '}
        <span className="text-offme-accent">Termos de Serviço</span> e a{' '}
        <span className="text-offme-accent">Política de Privacidade</span>, incluindo o{' '}
        <span className="text-offme-accent">Uso de Cookies</span>.
      </p>
    </form>
  );
}