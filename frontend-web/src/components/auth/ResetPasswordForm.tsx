'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { resetPassword } from '@/lib/api';
import { validatePassword } from '@/lib/validators';
import { AuthField } from './AuthField';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      router.push('/login?reset=1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="text-[15px] text-offme-muted">
        Link inválido.{' '}
        <Link href="/forgot-password" className="text-offme-accent hover:underline">
          Solicitar novo link
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField
        id="reset-password"
        label="Nova senha"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-offme-muted"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        }
      />

      <AuthField
        id="reset-confirm"
        label="Confirmar senha"
        type={showPassword ? 'text' : 'password'}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={loading} className="offme-btn-primary w-full py-3">
        {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Redefinir senha'}
      </button>
    </form>
  );
}