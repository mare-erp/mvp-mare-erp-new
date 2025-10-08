import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { RoleOrganizacao } from '@prisma/client';

// Handler para buscar um membro específico
async function getHandler(req: NextRequest, context: AuthContext) {
  const membroId = req.nextUrl.pathname.split('/').pop();
  try {
    const membro = await prisma.membroOrganizacao.findUnique({
      where: { id: membroId, organizacaoId: context.organizacaoId },
      include: { usuario: { select: { nome: true, email: true } } },
    });
    if (!membro) {
      return NextResponse.json({ message: 'Membro não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(membro);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar membro.' }, { status: 500 });
  }
}

// Handler para atualizar um membro (ex: mudar a role)
async function putHandler(req: NextRequest, context: AuthContext) {
  const membroId = req.nextUrl.pathname.split('/').pop();
  const { role } = await req.json();

  if (!role || !Object.values(RoleOrganizacao).includes(role)) {
      return NextResponse.json({ message: 'Role inválida.' }, { status: 400 });
  }

  try {
    if (context.role !== 'ADMIN' && context.role !== 'GESTOR') {
      return NextResponse.json({ message: 'Ação não permitida.' }, { status: 403 });
    }

    const membroParaAtualizar = await prisma.membroOrganizacao.findUnique({ where: { id: membroId } });
    if (membroParaAtualizar?.usuarioId === context.userId) {
        return NextResponse.json({ message: 'Você não pode alterar sua própria role.' }, { status: 403 });
    }

    const updatedMembro = await prisma.membroOrganizacao.update({
      where: { id: membroId, organizacaoId: context.organizacaoId },
      data: { role },
    });
    return NextResponse.json(updatedMembro);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar membro.' }, { status: 500 });
  }
}

// Handler para deletar um membro
async function deleteHandler(req: NextRequest, context: AuthContext) {
  const membroId = req.nextUrl.pathname.split('/').pop();

  if (!membroId) {
    return NextResponse.json({ message: 'ID do membro não fornecido.' }, { status: 400 });
  }

  try {
    if (context.role !== 'ADMIN' && context.role !== 'GESTOR') {
      return NextResponse.json({ message: 'Ação não permitida.' }, { status: 403 });
    }

    const membroParaDeletar = await prisma.membroOrganizacao.findUnique({ where: { id: membroId } });
    if (membroParaDeletar?.usuarioId === context.userId) {
      return NextResponse.json({ message: 'Você não pode remover a si mesmo.' }, { status: 403 });
    }

    await prisma.membroOrganizacao.delete({
      where: { id: membroId, organizacaoId: context.organizacaoId },
    });

    return NextResponse.json({ message: 'Membro removido com sucesso.' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao remover membro.' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
