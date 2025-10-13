import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { StatusPedido } from '@prisma/client';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não selecionada' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');
    const status = searchParams.get('status');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const where: any = { empresaId };
    if (usuarioId) where.usuarioId = usuarioId;
    if (status) where.status = status as StatusPedido;
    if (dataInicio && dataFim) {
      where.dataPedido = { gte: new Date(dataInicio), lte: new Date(`${dataFim}T23:59:59.999Z`) };
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(pedidos.map(p => ({ ...p, valorTotal: Number(p.valorTotal) })));

  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

async function postHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId, userId } = context;
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não selecionada' }, { status: 400 });
    }
    const body = await request.json();
    const { clienteId, itens, observacoes } = body;

    if (!clienteId || !itens || itens.length === 0) {
      return NextResponse.json({ error: 'Cliente e itens são obrigatórios' }, { status: 400 });
    }

    const produtosIds = itens.map((item: any) => item.produtoId).filter((id: any) => id);
    const produtos = await prisma.produto.findMany({ where: { id: { in: produtosIds }, empresaId } });
    const produtoMap = new Map(produtos.map(p => [p.id, p]));

    let valorTotal = 0;
    const itensParaCriar = itens.map((item: any) => {
      const produto = produtoMap.get(item.produtoId);
      if (!produto) throw new Error(`Produto com ID ${item.produtoId} não encontrado.`);
      const subtotal = produto.preco.toNumber() * item.quantidade;
      valorTotal += subtotal;
      return { produtoId: produto.id, descricao: produto.nome, quantidade: item.quantidade, precoUnitario: produto.preco, subtotal };
    });

    const ultimoPedido = await prisma.pedido.findFirst({ where: { empresaId }, orderBy: { numeroPedido: 'desc' } });
    const proximoNumero = (ultimoPedido?.numeroPedido || 0) + 1;

    const novoPedido = await prisma.pedido.create({
      data: {
        numeroPedido: proximoNumero,
        clienteId,
        usuarioId: userId,
        status: StatusPedido.ORCAMENTO,
        valorTotal,
        observacoesNF: observacoes || null,
        empresaId,
        itens: { create: itensParaCriar },
      },
    });

    return NextResponse.json({ ...novoPedido, valorTotal: Number(novoPedido.valorTotal) }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: (error as Error).message || 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, { requireCompany: true });
export const POST = withAuth(postHandler, { requireCompany: true });
