
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function GET(req: Request) {
  const result = await verifyAuth(req);

  if (!result.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Encontrar a primeira organização da qual o usuário é membro
    const membroOrganizacao = await prisma.membroOrganizacao.findFirst({
      where: {
        usuarioId: result.user.id,
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
