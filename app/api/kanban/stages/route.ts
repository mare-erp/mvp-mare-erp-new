import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

// GET /api/kanban/stages - Listar todas as etapas da organização
async function getHandler(req: NextRequest, context: AuthContext) {
  try {
    const stages = await prisma.kanbanStage.findMany({
      where: {
        organizacaoId: context.organizacaoId,
      },
      orderBy: {
        ordem: 'asc',
      },
    });
    return NextResponse.json(stages);
  } catch (error) {
    console.error('Erro ao buscar etapas do Kanban:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/kanban/stages - Criar uma nova etapa
async function postHandler(req: NextRequest, context: AuthContext) {
  try {
    const { nome, ordem } = await req.json();

    if (!nome || ordem === undefined) {
      return NextResponse.json({ error: 'Nome e ordem são obrigatórios' }, { status: 400 });
    }

    const newStage = await prisma.kanbanStage.create({
      data: {
        nome,
        ordem,
        organizacaoId: context.organizacaoId,
      },
    });

    return NextResponse.json(newStage, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar nova etapa do Kanban:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return NextResponse.json({ error: 'Uma etapa com este nome já existe.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
