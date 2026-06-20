import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { issueAuthTokens, verifyPassword } from '@/lib/auth-server';
import { findUserByEmail } from '@/lib/user-repository';
import { validateEmail, validatePassword } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    const emailError = validateEmail(email);
    if (emailError) return jsonError(emailError, 400);

    const passwordError = validatePassword(password, 4);
    if (passwordError) return jsonError('E-mail ou senha inválidos', 401);

    const user = await findUserByEmail(email);
    if (!user) {
      return jsonError('E-mail ou senha inválidos', 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return jsonError('E-mail ou senha inválidos', 401);
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const tokens = await issueAuthTokens(user, ip);

    return jsonOk(tokens);
  } catch (err) {
    console.error('[auth/login]', err);
    return jsonError('Erro interno ao entrar', 500);
  }
}