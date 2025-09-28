import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/lib/verifyAuth';

export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: context.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        fotoPerfil: true,
        ultimoLogin: true
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const organizacao = await prisma.organizacao.findUnique({
      where: { id: context.organizacaoId },
      include: {
        empresas: {
          where: { ativa: true },
          select: {
            id: true,
            nome: true,
            cnpj: true,
            logoUrl: true
          }
        }
      }
    });

    if (!organizacao) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: usuario,
      organizacao,
      role: context.role,
      permissoes: context.permissoes
    });

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

