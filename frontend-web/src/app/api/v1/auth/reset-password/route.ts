import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { resetPasswordWithToken } from '@/lib/password-reset-repository';
import { validatePassword } from '@/lib/validators';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, 'auth-reset-password', 10, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const token = String(body.token ?? '').trim();
    const password = String(body.password ?? '');

    if (!token) return jsonError('Token inválido', 400);
    const passwordError = validatePassword(password);
    if (passwordError) return jsonError(passwordError, 400);

    const ok = await resetPasswordWithToken(token, password);
    if (!ok) return jsonError('Link expirado ou inválido', 400);

    return jsonOk({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return jsonError('Erro ao redefinir senha', 500);
  }
}