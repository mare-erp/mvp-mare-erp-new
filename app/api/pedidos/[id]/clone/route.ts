import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import { StatusPedido } from '@prisma/client';

interface TokenPayload {
  empresaId: string;
  userId: string;
}

// POST - Clonar pedido
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId, userId: usuarioId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // Buscar o pedido original
    const pedidoOriginal = await prisma.pedido.findFirst({
      where: {
        id: params.id,
        empresaId: empresaId,
      },
      include: {
        itens: true
      }
    });

    if (!pedidoOriginal) {
      return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 });
    }

    const novoPedido = await prisma.$transaction(async (tx) => {
      // Gerar novo número de pedido
      const maiorPedido = await tx.pedido.aggregate({
        _max: { numeroPedido: true },
        where: { empresaId },
      });
      const novoNumeroPedido = (maiorPedido._max.numeroPedido || 0) + 1;

      // Criar o novo pedido
      const pedido = await tx.pedido.create({
        data: {
          empresaId,
          clienteId: pedidoOriginal.clienteId,
          usuarioId, // Usar o vendedor atual (quem está clonando)
          status: StatusPedido.ORCAMENTO, // Sempre criar como orçamento
          numeroPedido: novoNumeroPedido,
          valorTotal: pedidoOriginal.valorTotal,
        },
      });

      // Clonar os itens do pedido
      for (const item of pedidoOriginal.itens) {
        await tx.itemPedido.create({
          data: {
            pedidoId: pedido.id,
            produtoId: item.produtoId,
            descricao: item.descricao,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal,
          },
        });
      }

      // Buscar o pedido criado com as relações
      const pedidoCompleto = await tx.pedido.findUnique({
        where: { id: pedido.id },
        include: {
          cliente: { select: { nome: true } },
          usuario: { select: { nome: true } },
          itens: true
        }
      });

      return pedidoCompleto;
    });

    return NextResponse.json({
      ...novoPedido,
      valorTotal: Number(novoPedido!.valorTotal)
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao clonar pedido:", error);
    return NextResponse.json({ message: 'Erro ao clonar o pedido.' }, { status: 500 });
  }
}
