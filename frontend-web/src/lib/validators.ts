const USERNAME_RE = /^[a-zA-Z0-9_]{1,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, '');
}

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return 'Usuário: 1–15 caracteres (letras, números e _)';
  }
  return null;
}

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(normalizeEmail(value));
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return 'Informe seu e-mail';
  }
  if (!normalized.includes('@')) {
    return 'O e-mail precisa conter @ (ex: nome@outlook.de)';
  }
  if (!EMAIL_RE.test(normalized)) {
    return 'Informe um e-mail válido (ex: nome@outlook.de)';
  }
  return null;
}

export function validatePassword(password: string, minLength = 8): string | null {
  if (password.length < minLength) {
    return `A senha deve ter pelo menos ${minLength} caracteres`;
  }
  return null;
}

export function validateDisplayName(name: string): string | null {
  if (!name.trim()) return 'Informe seu nome de exibição';
  if (name.length > 50) return 'Nome de exibição muito longo';
  return null;
}