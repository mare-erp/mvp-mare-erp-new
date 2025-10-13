
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

async function getHandler(_req: NextRequest, context: AuthContext) {
  try {
    const membroOrganizacao = await prisma.membroOrganizacao.findFirst({
      where: {
        usuarioId: context.userId,
        ativo: true,
      },
      include: {
        organizacao: {
          include: {
            empresas: {
              where: { ativa: true },
              orderBy: { nome: 'asc' },
            },
          },
        },
      },
    });

    if (!membroOrganizacao) {
      return NextResponse.json({ error: 'Nenhuma organização encontrada para este usuário.' }, { status: 404 });
    }

    return NextResponse.json(membroOrganizacao.organizacao);
  } catch (error) {
    console.error('Erro ao buscar organização atual:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
