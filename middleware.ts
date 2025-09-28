// middleware.ts (Versão final e limpa)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth-token')?.value;
  const isPublicRoute = publicRoutes.includes(pathname);

  // Se tem token e tenta acessar rota pública -> vai para o dashboard
  if (authToken && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se NÃO tem token e tenta acessar rota protegida -> vai para o login
  if (!authToken && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};