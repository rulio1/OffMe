'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { AuthField } from './AuthField';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Informe seu e-mail ou usuário');
      return;
    }
    if (password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    setLoading(true);
    try {
      const session = await login(email.trim(), password);
      setSession(session);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      {error && (
        <p className="mb-4 text-[15px] text-red-400" role="alert">
          {error}
        </p>
      )}

      <AuthField
        id="email"
        name="email"
        type="text"
        autoComplete="username"
        label="E-mail ou usuário"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <AuthField
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="rounded-full p-2 text-offme-muted transition-colors hover:bg-offme-accent/10 hover:text-offme-accent"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        }
      />

      <div className="pt-2">
        <button
          type="button"
          className="text-[15px] text-offme-accent hover:underline"
        >
          Esqueceu a senha?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || !email.trim() || password.length < 4}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-offme-accent py-3.5 text-[17px] font-bold text-white transition-colors hover:bg-offme-accentHover disabled:cursor-default disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
      </button>
    </form>
  );
}