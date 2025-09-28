import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const tipo = searchParams.get('tipo');
    const skip = (page - 1) * limit;

    const where: any = {
      empresaId,
      ativo: true,
    };

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tipo && (tipo === 'PRODUTO' || tipo === 'SERVICO')) {
      where.tipo = tipo;
    }

    const produtos = await prisma.produto.findMany({
      where,
      orderBy: {
        nome: 'asc',
      },
      skip,
      take: limit,
    });

    const total = await prisma.produto.count({ where });

    // Retornar apenas o array de produtos para compatibilidade
    return NextResponse.json(produtos.map(produto => ({
      ...produto,
      preco: Number(produto.preco),
      custo: Number(produto.custo || 0),
      quantidadeEstoque: produto.quantidadeEstoque || 0,
      estoqueMinimo: produto.estoqueMinimo || 0,
      estoqueMaximo: produto.estoqueMaximo || 0
    })));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;
    const body = await request.json();

    const {
      nome,
      sku,
      tipo,
      descricao,
      preco,
      custo,
      quantidadeEstoque,
      estoqueMinimo,
      estoqueMaximo,
      unidadeMedida,
      codigoBarras,
      ncm,
      peso,
      altura,
      largura,
      comprimento,
      forcarControleEstoque,
    } = body;

    // Validações
    if (!nome || !preco) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar SKU automaticamente se não fornecido
    let finalSku = sku;
    if (!finalSku) {
      const count = await prisma.produto.count({
        where: { empresaId },
      });
      finalSku = `${tipo === 'PRODUTO' ? 'PROD' : 'SERV'}${(count + 1).toString().padStart(4, '0')}`;
    }

    // Verificar se SKU já existe
    const existingSku = await prisma.produto.findFirst({
      where: {
        empresaId,
        sku: finalSku,
        ativo: true,
      },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: 'SKU já existe para outro produto' },
        { status: 400 }
      );
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        sku: finalSku,
        tipo: tipo || 'PRODUTO',
        descricao,
        preco: parseFloat(preco),
        custo: custo ? parseFloat(custo) : 0,
        quantidadeEstoque: tipo === 'PRODUTO' ? (quantidadeEstoque || 0) : null,
        estoqueMinimo: estoqueMinimo || 0,
        estoqueMaximo: estoqueMaximo || 0,
        unidadeMedida: unidadeMedida || 'UN',
        codigoBarras,
        ncm,
        peso: peso ? parseFloat(peso) : null,
        altura: altura ? parseFloat(altura) : null,
        largura: largura ? parseFloat(largura) : null,
        comprimento: comprimento ? parseFloat(comprimento) : null,
        forcarControleEstoque: forcarControleEstoque || false,
        empresaId,
      },
    });

    // Registrar movimentação inicial de estoque se for produto com estoque
    if (tipo === 'PRODUTO' && quantidadeEstoque > 0) {
      await prisma.movimentacaoEstoque.create({
        data: {
          produtoId: produto.id,
          tipo: 'ENTRADA',
          quantidade: quantidadeEstoque,
          observacao: 'Estoque inicial',
          empresaId,
        },
      });
    }

    return NextResponse.json({
      ...produto,
      preco: Number(produto.preco),
      custo: Number(produto.custo || 0),
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Protegendo as rotas com o novo HOC de autenticação
export const GET = withAuth(getHandler, {
  requireCompany: true,
});

export const POST = withAuth(postHandler, {
  requireCompany: true,
});
