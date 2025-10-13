import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

const deleteHandler = async (
  _req: NextRequest,
  context: AuthContext,
  routeContext?: { params: { id: string } }
) => {
  try {
    if (context.role !== 'ADMIN' && context.role !== 'GESTOR') {
      return NextResponse.json({ message: 'Ação não permitida.' }, { status: 403 });
    }

    const membroId = routeContext?.params?.id;
    if (!membroId) {
      return NextResponse.json({ message: 'ID do membro não informado.' }, { status: 400 });
    }

    const membro = await prisma.membroOrganizacao.findUnique({ where: { id: membroId } });
    if (!membro || membro.organizacaoId !== context.organizacaoId) {
      return NextResponse.json({ message: 'Membro não encontrado.' }, { status: 404 });
    }

    if (membro.usuarioId === context.userId) {
      return NextResponse.json({ message: 'Você não pode remover a si mesmo.' }, { status: 403 });
    }

    await prisma.membroOrganizacao.delete({ where: { id: membroId } });

    return NextResponse.json({ message: 'Membro removido com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('[API Membros ID DELETE]', error);
    return NextResponse.json({ message: 'Erro ao remover membro.' }, { status: 500 });
  }
};

export const DELETE = withAuth(deleteHandler);
