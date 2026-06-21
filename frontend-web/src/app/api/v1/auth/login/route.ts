import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { issueAuthTokens, verifyPassword } from '@/lib/auth-server';
import { findUserByEmail, findUserByUsername } from '@/lib/user-repository';
import { isEmail, validatePassword } from '@/lib/validators';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, 'auth-login', 20, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const identifier = String(body.email ?? body.identifier ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!identifier) {
      return jsonError('Informe seu e-mail ou usuário', 400);
    }

    const passwordError = validatePassword(password, 4);
    if (passwordError) return jsonError('E-mail/usuário ou senha inválidos', 401);

    const user = isEmail(identifier)
      ? await findUserByEmail(identifier)
      : await findUserByUsername(identifier);

    if (!user) {
      return jsonError('E-mail/usuário ou senha inválidos', 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return jsonError('E-mail/usuário ou senha inválidos', 401);
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const tokens = await issueAuthTokens(user, ip);

    return jsonOk(tokens);
  } catch (err) {
    console.error('[auth/login]', err);
    return jsonError('Erro interno ao entrar', 500);
  }
}