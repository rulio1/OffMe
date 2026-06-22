import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];
const PUBLIC_PATHS = ['/welcome', '/terms', '/privacy', '/about'];

const PROTECTED_PREFIXES = [
  '/',
  '/explore',
  '/notifications',
  '/messages',
  '/bookmarks',
  '/profile',
  '/post',
  '/settings',
  '/moderation',
  '/lists',
  '/communities',
  '/grok',
];

function isPublicContent(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (pathname.startsWith('/post/')) return true;
  if (/^\/profile\/[^/]+$/.test(pathname)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('offme_token')?.value;
  const refresh = request.cookies.get('offme_refresh')?.value;
  const hasSession = Boolean(token || refresh);
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
    if (hasSession) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  if (isPublicContent(pathname)) {
    if (hasSession && pathname === '/welcome') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)
  );

  if (isProtected && !hasSession) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/welcome', request.url));
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/welcome',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/explore',
    '/notifications',
    '/settings',
    '/settings/:path*',
    '/moderation',
    '/messages',
    '/messages/:path*',
    '/bookmarks',
    '/profile',
    '/profile/:path*',
    '/post/:path*',
    '/lists',
    '/lists/:path*',
    '/communities',
    '/communities/:path*',
    '/grok',
    '/terms',
    '/privacy',
    '/about',
  ],
};