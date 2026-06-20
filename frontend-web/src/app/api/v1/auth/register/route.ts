import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { hashPassword, issueAuthTokens } from '@/lib/auth-server';
import { createUser, findUserByEmail, findUserByUsername } from '@/lib/user-repository';
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username ?? '').trim().toLowerCase();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const displayName = String(body.displayName ?? '').trim();

    const errors = [
      validateDisplayName(displayName),
      validateUsername(username),
      validateEmail(email),
      validatePassword(password),
    ].filter(Boolean);

    if (errors.length > 0) {
      return jsonError(errors[0]!, 400);
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return jsonError('Este e-mail já está cadastrado', 409);
    }

    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return jsonError('Este nome de usuário já está em uso', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ username, email, passwordHash, displayName });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const tokens = await issueAuthTokens(user, ip);

    return jsonOk(tokens, 201);
  } catch (err) {
    console.error('[auth/register]', err);

    if (isPgError(err) && err.code === '23505') {
      return jsonError('E-mail ou usuário já cadastrado', 409);
    }

    return jsonError('Erro interno ao criar conta', 500);
  }
}

function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}