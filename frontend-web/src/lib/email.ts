import { getSiteUrl } from './site';

export async function sendPasswordResetEmail(input: {
  to: string;
  token: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? 'OffMe <onboarding@resend.dev>';
  const siteUrl = getSiteUrl();
  const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(input.token)}`;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[email] Password reset link (dev):', resetUrl);
      return true;
    }
    return false;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: 'Redefinir senha — OffMe',
      html: `
        <p>Você solicitou a redefinição de senha no OffMe.</p>
        <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a></p>
        <p>O link expira em 1 hora. Se não foi você, ignore este e-mail.</p>
      `,
    }),
  });

  return res.ok;
}