
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

async function getHandler(
  request: NextRequest,
  context: AuthContext,
  params?: { id: string }
) {
  try {
    const { empresaId } = context;
    if (!empresaId) {
      return NextResponse.json(
        { error: 'Empresa não selecionada' },
        { status: 400 }
      );
    }
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto não informado' },
        { status: 400 }
      );
    }

    const produto = await prisma.produto.findFirst({
      where: {
        id,
        empresaId,
        ativo: true,
      },
    });

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...produto,
      preco: Number(produto.preco),
      custo: Number(produto.custo || 0),
      quantidadeEstoque: produto.quantidadeEstoque || 0,
      estoqueMinimo: produto.estoqueMinimo || 0,
      estoqueMaximo: produto.estoqueMaximo || 0
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function putHandler(
  request: NextRequest,
  context: AuthContext,
  params?: { id: string }
) {
  try {
    const { empresaId } = context;
    if (!empresaId) {
      return NextResponse.json(
        { error: 'Empresa não selecionada' },
        { status: 400 }
      );
    }
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto não informado' },
        { status: 400 }
      );
    }
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

    // Verificar se o produto existe e pertence à empresa
    const produtoExistente = await prisma.produto.findFirst({
      where: {
        id,
        empresaId,
        ativo: true,
      },
    });

    if (!produtoExistente) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Validações
    if (!nome || !preco) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se SKU já existe para outro produto (se foi alterado)
    if (sku && sku !== produtoExistente.sku) {
      const existingSku = await prisma.produto.findFirst({
        where: {
          empresaId,
          sku,
          ativo: true,
          id: { not: id },
        },
      });

      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU já existe para outro produto' },
          { status: 400 }
        );
      }
    }

    // Verificar se houve mudança na quantidade de estoque para registrar movimentação
    const quantidadeAnterior = produtoExistente.quantidadeEstoque || 0;
    const quantidadeNova = quantidadeEstoque !== undefined ? quantidadeEstoque : quantidadeAnterior;
    const diferencaEstoque = quantidadeNova - quantidadeAnterior;

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        nome: nome ?? produtoExistente.nome,
        sku: sku ?? produtoExistente.sku,
        tipo: tipo ?? produtoExistente.tipo,
        descricao: descricao ?? produtoExistente.descricao,
        preco: preco ? parseFloat(preco) : produtoExistente.preco,
        custo: custo !== undefined ? parseFloat(custo) : produtoExistente.custo,
        quantidadeEstoque: (tipo ?? produtoExistente.tipo) === 'PRODUTO' ? quantidadeNova : null,
        estoqueMinimo: estoqueMinimo !== undefined ? estoqueMinimo : produtoExistente.estoqueMinimo,
        estoqueMaximo: estoqueMaximo !== undefined ? estoqueMaximo : produtoExistente.estoqueMaximo,
        unidadeMedida: unidadeMedida ?? produtoExistente.unidadeMedida,
        codigoBarras: codigoBarras ?? produtoExistente.codigoBarras,
        ncm: ncm ?? produtoExistente.ncm,
        peso: peso !== undefined ? parseFloat(peso) : produtoExistente.peso,
        altura: altura !== undefined ? parseFloat(altura) : produtoExistente.altura,
        largura: largura !== undefined ? parseFloat(largura) : produtoExistente.largura,
        comprimento: comprimento !== undefined ? parseFloat(comprimento) : produtoExistente.comprimento,
        forcarControleEstoque: forcarControleEstoque !== undefined ? forcarControleEstoque : produtoExistente.forcarControleEstoque,
      },
    });

    // Registrar movimentação de estoque se houve alteração
    if ((tipo ?? produtoExistente.tipo) === 'PRODUTO' && diferencaEstoque !== 0) {
      await prisma.movimentacaoEstoque.create({
        data: {
          produtoId: id,
          tipo: diferencaEstoque > 0 ? 'ENTRADA' : 'SAIDA',
          quantidade: Math.abs(diferencaEstoque),
          observacao: 'Ajuste manual via edição do produto',
          empresaId,
        },
      });
    }

    return NextResponse.json({
      ...produto,
      preco: Number(produto.preco),
      custo: Number(produto.custo || 0),
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  request: NextRequest,
  context: AuthContext,
  params?: { id: string }
) {
  try {
    const { empresaId } = context;
    if (!empresaId) {
      return NextResponse.json(
        { error: 'Empresa não selecionada' },
        { status: 400 }
      );
    }
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto não informado' },
        { status: 400 }
      );
    }

    // Verificar se o produto existe e pertence à empresa
    const produtoExistente = await prisma.produto.findFirst({
      where: {
        id,
        empresaId,
        ativo: true,
      },
    });

    if (!produtoExistente) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o produto está sendo usado em pedidos
    const pedidosComProduto = await prisma.itemPedido.count({
      where: {
        produtoId: id,
      },
    });

    if (pedidosComProduto > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir o produto pois ele está sendo usado em pedidos' },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inativo
    await prisma.produto.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Protegendo as rotas com o novo HOC de autenticação
export const GET = withAuth(
  (req: NextRequest, context: AuthContext, routeContext?: { params: { id: string } }) =>
    getHandler(req, context, routeContext?.params),
  { requireCompany: true }
);

export const PUT = withAuth(
  (req: NextRequest, context: AuthContext, routeContext?: { params: { id: string } }) =>
    putHandler(req, context, routeContext?.params),
  { requireCompany: true }
);

export const DELETE = withAuth(
  (req: NextRequest, context: AuthContext, routeContext?: { params: { id: string } }) =>
    deleteHandler(req, context, routeContext?.params),
  { requireCompany: true }
);
