
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { StatusPedido } from '@prisma/client';
import { JWT_SECRET } from '@/app/lib/config';


interface TokenPayload {
  empresaId: string;
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');
    const status = searchParams.get('status');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const where: any = {
      empresaId,
    };

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    if (status) {
      where.status = status as StatusPedido;
    }

    if (dataInicio && dataFim) {
      where.dataPedido = {
        gte: new Date(dataInicio),
        lte: new Date(`${dataFim}T23:59:59.999Z`),
      };
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true, sku: true, tipo: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(pedidos.map(pedido => ({
      ...pedido,
      valorTotal: Number(pedido.valorTotal),
      itens: pedido.itens.map(item => ({
        ...item,
        precoUnitario: Number(item.precoUnitario),
        subtotal: Number(item.subtotal),
      })),
    })));
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId, userId } = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const { clienteId, itens, observacoes } = await request.json();

    if (!clienteId || !itens || itens.length === 0) {
      return NextResponse.json(
        { error: 'Cliente e itens do pedido são obrigatórios' },
        { status: 400 }
      );
    }

    const produtos = await prisma.produto.findMany({
      where: {
        id: { in: itens.map((item: any) => item.produtoId) },
        empresaId,
      },
    });

    const produtoMap = new Map(produtos.map(p => [p.id, p]));

    let valorTotal = 0;
    const itensParaCriar = [];

    for (const item of itens) {
      const produto = produtoMap.get(item.produtoId);

      if (!produto) {
        return NextResponse.json({ error: `Produto com ID ${item.produtoId} não encontrado.` }, { status: 404 });
      }

      const subtotal = produto.preco.toNumber() * item.quantidade;
      valorTotal += subtotal;

      itensParaCriar.push({
        produtoId: produto.id,
        descricao: produto.nome,
        quantidade: item.quantidade,
        precoUnitario: produto.preco,
        subtotal: subtotal,
      });
    }

    // Gerar número do pedido sequencial
    const ultimoPedido = await prisma.pedido.findFirst({
      where: { empresaId },
      orderBy: { numeroPedido: 'desc' },
    });
    const proximoNumero = ultimoPedido ? ultimoPedido.numeroPedido + 1 : 1;

    const novoPedido = await prisma.pedido.create({
      data: {
        numeroPedido: proximoNumero,
        clienteId,
        usuarioId: userId, // O usuário logado é o vendedor
        status: StatusPedido.ORCAMENTO, // Status inicial
        valorTotal: valorTotal,
        observacoesNF: observacoes || null,
        empresaId,
        itens: {
          create: itensParaCriar,
        },
      },
    });

    // Atualizar estoque e criar movimentação em uma transação
    await prisma.$transaction(async (tx) => {
      for (const item of itens) {
        const produto = produtoMap.get(item.produtoId);
        if (produto && produto.tipo === 'PRODUTO') {
          await tx.produto.update({
            where: { id: produto.id },
            data: { quantidadeEstoque: { decrement: item.quantidade } },
          });

          await tx.movimentacaoEstoque.create({
            data: {
              produtoId: produto.id,
              tipo: 'SAIDA',
              quantidade: item.quantidade,
              observacao: `Venda - Pedido ${novoPedido.numeroPedido}`,
              empresaId,
            },
          });
        }
      }
    });

    return NextResponse.json({
      ...novoPedido,
      valorTotal: Number(novoPedido.valorTotal),
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

