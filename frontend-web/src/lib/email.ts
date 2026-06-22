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

export async function sendWelcomeEmail(input: {
  to: string;
  displayName: string;
  username: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? 'OffMe <onboarding@resend.dev>';
  const siteUrl = getSiteUrl();

  if (!apiKey) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: 'Bem-vindo ao beta do OffMe',
      html: `
        <p>Olá, ${input.displayName}!</p>
        <p>Sua conta <strong>@${input.username}</strong> foi criada. Você está no beta do OffMe.</p>
        <p><strong>3 passos para começar:</strong></p>
        <ol>
          <li>Siga 2–3 pessoas em <a href="${siteUrl}/explore">Explorar</a></li>
          <li>Publique seu primeiro post</li>
          <li>Convide um amigo pelo link em Configurações</li>
        </ol>
        <p>Encontrou um bug? Use <a href="${siteUrl}/settings/feedback">Enviar feedback</a> no app.</p>
        <p><a href="${siteUrl}">Abrir OffMe</a></p>
      `,
    }),
  });

  return res.ok;
}

export async function sendWeeklyDigestEmail(input: {
  to: string;
  displayName: string;
  username: string;
  stats: { unreadNotifications: number; newFollowers: number };
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? 'OffMe <onboarding@resend.dev>';
  const siteUrl = getSiteUrl();

  if (!apiKey) return false;

  const lines: string[] = [];
  if (input.stats.unreadNotifications > 0) {
    lines.push(
      `<li><strong>${input.stats.unreadNotifications}</strong> notificação(ões) não lida(s)</li>`
    );
  }
  if (input.stats.newFollowers > 0) {
    lines.push(
      `<li><strong>${input.stats.newFollowers}</strong> novo(s) seguidor(es) esta semana</li>`
    );
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
      subject: 'Seu resumo semanal no OffMe',
      html: `
        <p>Olá, ${input.displayName} (@${input.username})!</p>
        <p>Resumo da sua semana no OffMe:</p>
        <ul>${lines.join('')}</ul>
        <p><a href="${siteUrl}/notifications">Ver notificações</a> · <a href="${siteUrl}">Abrir OffMe</a></p>
        <p style="color:#666;font-size:12px">Desative em Configurações → Notificações → Resumo por email.</p>
      `,
    }),
  });

  return res.ok;
}