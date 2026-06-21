import type { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api-response';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

export function enforceRateLimit(
  request: NextRequest,
  scope: string,
  limit = 120,
  windowMs = 60_000
) {
  const key = rateLimitKey(request, scope);
  const result = checkRateLimit(key, limit, windowMs);

  if (!result.ok) {
    return jsonError('Muitas requisições. Tente novamente em instantes.', 429);
  }

  return null;
}