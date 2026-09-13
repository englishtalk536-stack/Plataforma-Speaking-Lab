import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/login', '/register', '/api/auth'];

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  if (PUBLIC_PATHS.some((path) => url.pathname.startsWith(path))) return NextResponse.next();

  const protectedArea = url.pathname.startsWith('/practice') || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/teacher') || url.pathname.startsWith('/admin');
  if (!protectedArea) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = token.role as string | undefined;
  if (url.pathname.startsWith('/admin') && role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url));
  if (url.pathname.startsWith('/teacher') && role !== 'TEACHER' && role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/practice/:path*', '/dashboard/:path*', '/teacher/:path*', '/admin/:path*'],
};
