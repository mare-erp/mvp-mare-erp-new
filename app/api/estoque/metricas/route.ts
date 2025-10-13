import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;

    const totalProdutos = await prisma.produto.count({
      where: { empresaId, ativo: true },
    });

    const produtosEstoqueBaixoResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*)::int
        FROM "Produto"
        WHERE "empresaId" = ${empresaId}
        AND ativo = true
        AND tipo = 'PRODUTO'
        AND "quantidadeEstoque" > 0
        AND "estoqueMinimo" > 0
        AND "quantidadeEstoque" <= "estoqueMinimo"`;

    const produtosSemEstoque = await prisma.produto.count({
      where: { empresaId, ativo: true, tipo: 'PRODUTO', quantidadeEstoque: { lte: 0 } },
    });

    const valorEstoqueCustoResult: any[] = await prisma.$queryRaw`
      SELECT SUM(custo * "quantidadeEstoque") as total
      FROM "Produto"
      WHERE "empresaId" = ${empresaId} AND ativo = true AND tipo = 'PRODUTO'`;

    const valorEstoqueVendaResult: any[] = await prisma.$queryRaw`
      SELECT SUM(preco * "quantidadeEstoque") as total
      FROM "Produto"
      WHERE "empresaId" = ${empresaId} AND ativo = true AND tipo = 'PRODUTO'`;

    const metricas = {
      totalProdutos,
      valorEstoqueCusto: Number(valorEstoqueCustoResult[0].total) || 0,
      valorEstoqueVenda: Number(valorEstoqueVendaResult[0].total) || 0,
      produtosEstoqueBaixo: produtosEstoqueBaixoResult[0].count || 0,
      produtosSemEstoque,
    };

    return NextResponse.json(metricas);
  } catch (error) {
    console.error('Erro ao buscar métricas do estoque:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, { requireCompany: true });
