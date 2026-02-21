import { NextResponse } from 'next/server';

const protectedPaths = ['/admin/orders', '/admin/products', '/admin/settings'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const isAuth = request.cookies.get('admin_auth')?.value === '1';
  if (isAuth) return NextResponse.next();

  const loginUrl = new URL('/admin', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*']
};
