import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth } from '@/app/lib/verifyAuth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { userId } = authResult;

    // Buscar organizações do usuário
    const membros = await prisma.membroOrganizacao.findMany({
      where: {
        usuarioId: userId,
      },
      include: {
        organizacao: {
          include: {
            empresas: {
              where: {
                ativa: true,
              },
              orderBy: {
                nome: 'asc',
              },
            },
          },
        },
      },
    });

    const organizacoes = membros.map(membro => ({
      ...membro.organizacao,
      role: membro.role,
    }));

    return NextResponse.json(organizacoes);
  } catch (error) {
    console.error('Erro ao buscar organizações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { userId } = authResult;
    const body = await request.json();

    const { nome } = body;

    // Validações
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da organização é obrigatório' },
        { status: 400 }
      );
    }

    // Criar organização
    const organizacao = await prisma.organizacao.create({
      data: {
        nome,
      },
    });

    // Adicionar usuário como admin da organização
    await prisma.membroOrganizacao.create({
      data: {
        organizacaoId: organizacao.id,
        usuarioId: userId,
        role: 'ADMIN',
      },
    });

    return NextResponse.json(organizacao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar organização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
