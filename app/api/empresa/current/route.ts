import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  empresaId: string;
  userId: string;
  organizacaoId: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json({ message: 'Empresa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
