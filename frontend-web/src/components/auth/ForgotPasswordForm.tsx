'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { requestPasswordReset } from '@/lib/api';
import { normalizeEmail, validateEmail } from '@/lib/validators';
import { AuthField } from './AuthField';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const normalized = normalizeEmail(email);
    const validationError = validateEmail(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(normalized);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-[15px] text-offme-muted">
        Informe o e-mail da sua conta. Enviaremos um link para redefinir a senha.
      </p>

      <AuthField
        id="forgot-email"
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-offme-accent">{message}</p>}

      <button type="submit" disabled={loading} className="offme-btn-primary w-full py-3">
        {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Enviar link'}
      </button>

      <p className="text-center text-[15px] text-offme-muted">
        <Link href="/login" className="text-offme-accent hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}