import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;

    const [totalProdutos, produtosEstoqueBaixo, produtosSemEstoque, valorEstoque] = await Promise.all([
      prisma.produto.count({
        where: {
          empresaId,
          ativo: true,
        },
      }),
      prisma.produto.count({
        where: {
          empresaId,
          ativo: true,
          tipo: 'PRODUTO',
          quantidadeEstoque: {
            gt: 0,
            lte: prisma.produto.fields.estoqueMinimo,
          },
        },
      }),
      prisma.produto.count({
        where: {
          empresaId,
          ativo: true,
          tipo: 'PRODUTO',
          quantidadeEstoque: 0,
        },
      }),
      prisma.produto.aggregate({
        where: {
          empresaId,
          ativo: true,
          tipo: 'PRODUTO',
        },
        _sum: {
          preco: true,
          custo: true,
          quantidadeEstoque: true,
        },
      }),
    ]);

    const valorEstoqueCusto = Number(valorEstoque._sum.custo || 0) * Number(valorEstoque._sum.quantidadeEstoque || 0);
    const valorEstoqueVenda = Number(valorEstoque._sum.preco || 0) * Number(valorEstoque._sum.quantidadeEstoque || 0);

    const metricas = {
      totalProdutos,
      valorEstoqueCusto,
      valorEstoqueVenda,
      produtosEstoqueBaixo,
      produtosSemEstoque,
    };

    return NextResponse.json(metricas);
  } catch (error) {
    console.error('Erro ao buscar métricas do estoque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler, {
  requireCompany: true,
});
