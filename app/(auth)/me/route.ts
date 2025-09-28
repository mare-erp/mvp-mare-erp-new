// app/api/auth/me/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Importação correta para Route Handlers
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';

// Tipagem para o payload do token para segurança de tipos
interface TokenPayload {
  userId: string;
  empresaId: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  // 1. Verifica se o token existe no cookie
  if (!token) {
    return NextResponse.json({ message: 'Não autorizado: Token não fornecido.' }, { status: 401 });
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    // Erro de configuração do servidor, não do cliente
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }

  try {
    // 2. Verifica se o token é válido e não expirou
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // 3. Busca os dados mais recentes do usuário no banco de dados
    // Isso garante que o usuário ainda existe e está ativo no sistema
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Não autorizado: Usuário não encontrado.' }, { status: 401 });
    }

    // 4. Se tudo estiver correto, retorna os dados do usuário
    return NextResponse.json({ user });

  } catch (error) {
    // Se jwt.verify falhar (token inválido, expirado, etc.), ele lança um erro
    return NextResponse.json({ message: 'Não autorizado: Token inválido.' }, { status: 401 });
  }
}