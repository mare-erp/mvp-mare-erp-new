import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth } from '@/app/lib/verifyAuth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { empresaId } = authResult;

    // Buscar todos os produtos da empresa
    const produtos = await prisma.produto.findMany({
      where: {
        empresaId,
        ativo: true,
      },
    });

    // Calcular métricas
    const totalProdutos = produtos.length;
    
    let valorEstoqueCusto = 0;
    let valorEstoqueVenda = 0;
    let produtosEstoqueBaixo = 0;
    let produtosSemEstoque = 0;

    produtos.forEach(produto => {
      const quantidade = produto.quantidadeEstoque || 0;
      const custo = Number(produto.custo || 0);
      const preco = Number(produto.preco);

      // Calcular valores apenas para produtos (não serviços)
      if (produto.tipo === 'PRODUTO') {
        valorEstoqueCusto += quantidade * custo;
        valorEstoqueVenda += quantidade * preco;

        // Verificar status do estoque
        if (quantidade === 0) {
          produtosSemEstoque++;
        } else if (quantidade <= (produto.estoqueMinimo || 0)) {
          produtosEstoqueBaixo++;
        }
      }
    });

    const metricas = {
      totalProdutos,
      valorEstoqueCusto,
      valorEstoqueVenda,
      produtosEstoqueBaixo,
      produtosSemEstoque
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

