import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { z } from 'zod';
import { StatusPedido, TipoItem } from '@prisma/client';

const itemPedidoSchema = z.object({
  produtoId: z.string().cuid().optional(),
  descricao: z.string().min(1, "A descrição do item é obrigatória."),
  quantidade: z.number().positive("A quantidade deve ser maior que zero."),
  precoUnitario: z.number().nonnegative("O preço não pode ser negativo."),
  tipo: z.nativeEnum(TipoItem)
});

const createPedidoSchema = z.object({
  empresaId: z.string().cuid(),
  numeroPedido: z.number().int().positive(),
  clienteId: z.string().cuid("ID de cliente inválido."),
  status: z.nativeEnum(StatusPedido),
  validadeOrcamento: z.string().optional(),
  dataEntrega: z.string().optional(),
  frete: z.number().nonnegative().optional(),
  informacoesNegociacao: z.string().optional(),
  observacoesNF: z.string().optional(),
  itens: z.array(itemPedidoSchema).min(1, "O pedido deve ter pelo menos um item."),
});

async function getHandler(req: NextRequest, context: AuthContext) {
  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get('empresaId');
  const statusParam = searchParams.get('status');
  const status = statusParam ? StatusPedido[statusParam as keyof typeof StatusPedido] : null;
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');

  let whereClause: any = {};

  if (empresaId) {
    const hasAccess = await prisma.empresa.findFirst({ where: { id: empresaId, organizacaoId: context.organizacaoId }});
    if (!hasAccess) {
        return NextResponse.json({ message: 'Acesso negado a esta empresa.' }, { status: 403 });
    }
    whereClause.empresaId = empresaId;
  } else {
    const org = await prisma.organizacao.findUnique({
        where: { id: context.organizacaoId },
        include: { empresas: { select: { id: true } } }
    });
    if (!org) return NextResponse.json([]);
    const empresaIds = org.empresas.map(e => e.id);
    whereClause.empresaId = { in: empresaIds };
  }

  if (status) whereClause.status = status;
  if (dataInicio && dataFim) {
    whereClause.dataPedido = { 
      gte: new Date(dataInicio), 
      lte: new Date(dataFim) 
    };
  }

  const pedidos = await prisma.pedido.findMany({
    where: whereClause,
    include: {
      cliente: { select: { nome: true } },
      usuario: { select: { nome: true } },
    },
    orderBy: { dataPedido: 'desc' },
  });

  return NextResponse.json(pedidos.map(p => ({...p, valorTotal: Number(p.valorTotal)})));
}

async function postHandler(req: NextRequest, context: AuthContext) {
  const body = await req.json();
  const validation = createPedidoSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
  }
  
  const { empresaId, numeroPedido, clienteId, status, validadeOrcamento, dataEntrega, frete, informacoesNegociacao, observacoesNF, itens } = validation.data;
  const usuarioId = context.userId;

  const hasAccess = await prisma.empresa.findFirst({ where: { id: empresaId, organizacaoId: context.organizacaoId }});
  if (!hasAccess) {
    return NextResponse.json({ message: 'Acesso negado para criar pedido nesta empresa.' }, { status: 403 });
  }

  try {
    const novoPedido = await prisma.$transaction(async (tx) => {
      const pedidoExistente = await tx.pedido.findUnique({
        where: { empresaId_numeroPedido: { empresaId, numeroPedido } },
      });

      if (pedidoExistente) {
        throw new Error(`Já existe um pedido com o número ${numeroPedido}`);
      }

      const valorTotal = itens.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0) + (frete || 0);

      const pedido = await tx.pedido.create({
        data: {
          empresaId,
          clienteId,
          usuarioId,
          status,
          numeroPedido,
          valorTotal,
          validadeOrcamento: validadeOrcamento ? new Date(validadeOrcamento) : null,
          dataEntrega: dataEntrega ? new Date(dataEntrega) : null,
          frete: frete || 0,
          informacoesNegociacao,
          observacoesNF,
        },
      });

      await tx.historicoPedido.create({
        data: {
          pedidoId: pedido.id,
          descricao: `Pedido criado com status: ${status}`,
        },
      });

      for (const item of itens) {
        await tx.itemPedido.create({
          data: {
            pedidoId: pedido.id,
            produtoId: item.produtoId,
            descricao: item.descricao,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.quantidade * item.precoUnitario,
          },
        });

        if (item.tipo === 'PRODUTO' && item.produtoId && status === 'VENDIDO') {
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { quantidadeEstoque: { decrement: item.quantidade } },
          });

          await tx.movimentacaoEstoque.create({
            data: {
              produtoId: item.produtoId,
              tipo: 'SAIDA',
              quantidade: item.quantidade,
              observacao: `Venda - Pedido #${numeroPedido}`,
              empresaId,
            },
          });
        }
      }

      if (status === 'VENDIDO') {
        await tx.cliente.updateMany({
          where: { id: clienteId, primeiraCompraConcluida: false },
          data: { primeiraCompraConcluida: true },
        });
      }

      return pedido;
    });

    return NextResponse.json(novoPedido, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Erro ao criar o pedido.' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
