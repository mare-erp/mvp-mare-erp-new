
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { StatusPedido } from '@prisma/client';

interface TokenPayload {
  empresaId: string;
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');
    const status = searchParams.get('status');

    const pedidos = await prisma.pedido.findMany({
      where: {
        empresaId,
        ...(usuarioId && { usuarioId }),
        ...(status && { status: status as StatusPedido }),
      },
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

    const { empresaId, userId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const { clienteId, itens, observacoes } = await request.json();

    if (!clienteId || !itens || itens.length === 0) {
      return NextResponse.json(
        { error: 'Cliente e itens do pedido são obrigatórios' },
        { status: 400 }
      );
    }

    let valorTotal = 0;
    const itensParaCriar = [];

    for (const item of itens) {
      const produto = await prisma.produto.findUnique({
        where: { id: item.produtoId, empresaId },
      });

      if (!produto) {
        return NextResponse.json({ error: `Produto com ID ${item.produtoId} não encontrado.` }, { status: 404 });
      }

      const subtotal = produto.preco.toNumber() * item.quantidade;
      valorTotal += subtotal;

      itensParaCriar.push({
        produtoId: produto.id,
        quantidade: item.quantidade,
        precoUnitario: produto.preco,
        subtotal: subtotal,
      });

      // Se for produto, subtrair do estoque
      if (produto.tipo === 'PRODUTO') {
        await prisma.produto.update({
          where: { id: produto.id },
          data: {
            quantidadeEstoque: { decrement: item.quantidade },
          },
        });

        await prisma.movimentacaoEstoque.create({
          data: {
            produtoId: produto.id,
            tipo: 'SAIDA',
            quantidade: item.quantidade,
            observacao: `Venda - Pedido ${clienteId}`,
            empresaId,
          },
        });
      }
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
        vendedorId: userId, // O usuário logado é o vendedor
        status: StatusPedido.ORCAMENTO, // Status inicial
        valorTotal: valorTotal,
        observacoesNF: observacoes || null,
        empresaId,
        itens: {
          create: itensParaCriar,
        },
      },
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

