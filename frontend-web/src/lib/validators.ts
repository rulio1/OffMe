const USERNAME_RE = /^[a-zA-Z0-9_]{1,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return 'Usuário: 1–15 caracteres (letras, números e _)';
  }
  return null;
}

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function validateEmail(email: string): string | null {
  if (!email.trim() || !EMAIL_RE.test(email)) {
    return 'Informe um e-mail válido';
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