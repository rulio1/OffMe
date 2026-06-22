import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { sendPasswordResetEmail } from '@/lib/email';
import { createPasswordResetToken } from '@/lib/password-reset-repository';
import { normalizeEmail, validateEmail } from '@/lib/validators';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, 'auth-forgot-password', 5, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ''));
    const emailError = validateEmail(email);
    if (emailError) return jsonError(emailError, 400);

    const result = await createPasswordResetToken(email);
    if (result) {
      const sent = await sendPasswordResetEmail({ to: email, token: result.token });
      if (!sent && process.env.NODE_ENV !== 'development') {
        console.warn('[auth/forgot-password] E-mail não enviado — configure RESEND_API_KEY');
      }
    }

    return jsonOk({
      message:
        'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha em instantes.',
    });
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    return jsonError('Erro ao processar solicitação', 500);
  }
}