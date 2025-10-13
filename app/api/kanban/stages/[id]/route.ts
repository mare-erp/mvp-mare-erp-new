import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

// PUT /api/kanban/stages/[id] - Atualizar uma etapa
async function putHandler(
  req: NextRequest,
  context: AuthContext,
  routeContext?: { params: { id: string } }
) {
  try {
    const id = routeContext?.params?.id;
    if (!id) {
      return NextResponse.json({ error: 'ID da etapa não informado' }, { status: 400 });
    }
    const body = await req.json();
    const { nome, capacidade } = body;

    const stage = await prisma.kanbanStage.findFirst({
      where: { id, organizacaoId: context.organizacaoId },
    });

    if (!stage) {
      return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 });
    }

    const updatedStage = await prisma.kanbanStage.update({
      where: { id },
      data: {
        nome,
        capacidade,
      },
    });

    return NextResponse.json(updatedStage);
  } catch (error) {
    console.error('Erro ao atualizar etapa do Kanban:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/kanban/stages/[id] - Excluir uma etapa
async function deleteHandler(
  req: NextRequest,
  context: AuthContext,
  routeContext?: { params: { id: string } }
) {
    try {
        const id = routeContext?.params?.id;
        if (!id) {
          return NextResponse.json({ error: 'ID da etapa não informado' }, { status: 400 });
        }
        await prisma.kanbanStage.delete({ where: { id, organizacaoId: context.organizacaoId } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Erro ao excluir etapa do Kanban:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
