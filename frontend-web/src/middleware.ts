import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PATHS = ['/login', '/signup'];

const PROTECTED_PREFIXES = [
  '/',
  '/explore',

  '/notifications',
  '/messages',
  '/bookmarks',
  '/profile',
  '/post',
];

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

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)
  );

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/explore',
  
    '/notifications',
    '/messages',
    '/messages/:path*',
    '/bookmarks',
    '/profile',
    '/profile/:path*',
    '/post/:path*',
  ],
};