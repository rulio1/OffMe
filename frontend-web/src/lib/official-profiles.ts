/**
 * Centralized registry of official OffMe profiles.
 *
 * These accounts represent the product, teams, and programs (e.g. Beta Team,
 * Support, Safety). On the clients we override their avatar/banner with brand
 * assets and mark them with a distinct "Official" seal that is separate from
 * regular user verification.
 *
 * Single source of truth for the web. Mobile clients keep an equivalent list.
 */

export interface OfficialProfile {
  /** Lowercased username as returned by the API. */
  username: string;
  /** Display name shown if the API returns an empty one. */
  displayName: string;
  /** Short role description used as a tooltip/alt. */
  role: string;
  /** Absolute or root-relative URL to the brand avatar. */
  avatarUrl: string;
  /** Absolute or root-relative URL to the brand banner. */
  bannerUrl: string;
}

/**
 * Public base URL used when constructing absolute asset URLs for mobile clients.
 * Defaults to the production site; override with NEXT_PUBLIC_SITE_URL locally.
 */
export function getOfficialAssetBase(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_SITE_URL || '';
}

export const OFFICIAL_PROFILES: readonly OfficialProfile[] = [
  {
    username: 'offme',
    displayName: 'OffMe',
    role: 'Conta oficial',
    avatarUrl: '/brand/offme-official-avatar.png',
    bannerUrl: '/brand/offme-banner.png',
  },
  {
    username: 'betateam',
    displayName: 'Beta Team',
    role: 'Equipa Beta',
    avatarUrl: '/brand/beta-team-avatar.png',
    bannerUrl: '/brand/offme-banner.png',
  },
  {
    username: 'beta',
    displayName: 'Beta',
    role: 'Programa Beta',
    avatarUrl: '/brand/beta-team-avatar.png',
    bannerUrl: '/brand/offme-banner.png',
  },
  {
    username: 'support',
    displayName: 'Suporte OffMe',
    role: 'Suporte',
    avatarUrl: '/brand/offme-official-avatar.png',
    bannerUrl: '/brand/offme-banner.png',
  },
  {
    username: 'safety',
    displayName: 'Segurança OffMe',
    role: 'Segurança & Confiança',
    avatarUrl: '/brand/offme-official-avatar.png',
    bannerUrl: '/brand/offme-banner.png',
  },
] as const;

const OFFICIAL_BY_USERNAME: ReadonlyMap<string, OfficialProfile> = new Map(
  OFFICIAL_PROFILES.map((p) => [p.username.toLowerCase(), p])
);

/** Returns true if the username is an official OffMe account. */
export function isOfficialProfile(username: string | undefined | null): boolean {
  if (!username) return false;
  return OFFICIAL_BY_USERNAME.has(username.toLowerCase());
}

/** Returns the official profile metadata, if any. */
export function getOfficialProfile(username: string | undefined | null): OfficialProfile | undefined {
  if (!username) return undefined;
  return OFFICIAL_BY_USERNAME.get(username.toLowerCase());
}

/**
 * Apply official overrides to a raw user record. Returns the avatar/banner to
 * use (preferring official brand assets) and an `isOfficial` flag.
 */
export function applyOfficialOverrides(raw: {
  username?: string | undefined;
  avatarUrl?: string | undefined;
  bannerUrl?: string | undefined;
}): {
  avatarUrl: string | undefined;
  bannerUrl: string | undefined;
  isOfficial: boolean;
} {
  const official = getOfficialProfile(raw.username);
  if (!official) {
    return {
      avatarUrl: raw.avatarUrl,
      bannerUrl: raw.bannerUrl,
      isOfficial: false,
    };
  }
  return {
    avatarUrl: official.avatarUrl,
    bannerUrl: official.bannerUrl,
    isOfficial: true,
  };
}