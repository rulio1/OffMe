export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://offme.vercel.app';
}

export const SITE_NAME = 'OffMe';
export const SITE_DESCRIPTION = 'Desconecte do ruído. Conecte com o que importa.';