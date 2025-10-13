import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';
import { StatusPedido, TipoItem } from '@prisma/client';

interface TokenPayload {
  empresaId: string;
  userId: string;
}

const itemPedidoSchema = z.object({
  produtoId: z.string().cuid().optional(),
  descricao: z.string().min(1, "A descrição do item é obrigatória."),
  quantidade: z.number().positive("A quantidade deve ser maior que zero."),
  precoUnitario: z.number().nonnegative("O preço não pode ser negativo."),
  tipo: z.nativeEnum(TipoItem)
});

const updatePedidoSchema = z.object({
  numeroPedido: z.number().int().positive().optional(),
  clienteId: z.string().cuid("ID de cliente inválido.").optional(),
  status: z.nativeEnum(StatusPedido).optional(),
  validadeOrcamento: z.string().optional(),
  dataEntrega: z.string().optional(),
  frete: z.number().nonnegative().optional(),
  informacoesNegociacao: z.string().optional(),
  observacoesNF: z.string().optional(),
  itens: z.array(itemPedidoSchema).min(1, "O pedido deve ter pelo menos um item.").optional(),
});

// GET - Buscar pedido específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const pedido = await prisma.pedido.findFirst({
      where: {
        id: params.id,
        empresaId: empresaId,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true, email: true } },
        empresa: {
          select: {
            nome: true,
            telefone: true,
            email: true,
            rua: true,
            numero: true,
            complemento: true,
            bairro: true,
            cidade: true,
            uf: true,
            cep: true
          }
        },
        itens: {
          include: {
            produto: { select: { id: true, nome: true, tipo: true } }
          }
        },
        historico: {
          orderBy: { data: 'desc' }
        }
      },
    });

    if (!pedido) {
      return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      ...pedido,
      valorTotal: Number(pedido.valorTotal),
      frete: Number(pedido.frete || 0),
      itens: pedido.itens.map(item => ({
        ...item,
        precoUnitario: Number(item.precoUnitario),
        valorTotal: Number(item.precoUnitario) * item.quantidade
      }))
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json({ message: 'Erro ao buscar pedido.' }, { status: 500 });
  }
}

// PUT - Atualizar pedido
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    const body = await request.json();
    const validation = updatePedidoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: "Dados inválidos.", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }
    
    const { 
      numeroPedido, 
      clienteId, 
      status, 
      validadeOrcamento, 
      dataEntrega, 
      frete, 
      informacoesNegociacao, 
      observacoesNF, 
      itens 
    } = validation.data;

    // Verificar se o pedido existe e pertence à empresa
    const pedidoExistente = await prisma.pedido.findFirst({
      where: {
        id: params.id,
        empresaId: empresaId,
      },
      include: {
        itens: true
      }
    });

    if (!pedidoExistente) {
      return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 });
    }

    const pedidoAtualizado = await prisma.$transaction(async (tx) => {
      // Verificar se o novo número do pedido já existe (se fornecido)
      if (numeroPedido && numeroPedido !== pedidoExistente.numeroPedido) {
        const pedidoComNumero = await tx.pedido.findUnique({
          where: { empresaId_numeroPedido: { empresaId, numeroPedido } },
        });

        if (pedidoComNumero) {
          throw new Error(`Já existe um pedido com o número ${numeroPedido}`);
        }
      }

      // Preparar dados para atualização
      const updateData: any = {};
      if (numeroPedido) updateData.numeroPedido = numeroPedido;
      if (clienteId) updateData.clienteId = clienteId;
      if (status) updateData.status = status;
      if (validadeOrcamento !== undefined) updateData.validadeOrcamento = validadeOrcamento ? new Date(validadeOrcamento) : null;
      if (dataEntrega !== undefined) updateData.dataEntrega = dataEntrega ? new Date(dataEntrega) : null;
      if (frete !== undefined) updateData.frete = frete;
      if (informacoesNegociacao !== undefined) updateData.informacoesNegociacao = informacoesNegociacao;
      if (observacoesNF !== undefined) updateData.observacoesNF = observacoesNF;
      
      // Se há itens para atualizar, calcular novo valor total
      if (itens) {
        const valorItens = itens.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0);
        const freteValor = frete !== undefined ? frete : Number(pedidoExistente.frete ?? 0);
        const valorTotal = valorItens + freteValor;
        updateData.valorTotal = valorTotal;

        // Remover itens existentes
        await tx.itemPedido.deleteMany({
          where: { pedidoId: params.id }
        });

        // Criar novos itens
        for (const item of itens) {
          await tx.itemPedido.create({
            data: {
              pedidoId: params.id,
              produtoId: item.produtoId,
              descricao: item.descricao,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              subtotal: item.quantidade * item.precoUnitario,
            },
          });
        }
      }

      // Criar histórico da alteração
      const alteracoes = [];
      if (status && status !== pedidoExistente.status) {
        alteracoes.push(`Status alterado de ${pedidoExistente.status} para ${status}`);
      }
      if (numeroPedido && numeroPedido !== pedidoExistente.numeroPedido) {
        alteracoes.push(`Número alterado de ${pedidoExistente.numeroPedido} para ${numeroPedido}`);
      }
      if (alteracoes.length > 0) {
        await tx.historicoPedido.create({
          data: {
            pedidoId: params.id,
            descricao: alteracoes.join(', ')
          },
        });
      }

      const pedido = await tx.pedido.update({
        where: { id: params.id },
        data: updateData,
        include: {
          cliente: { select: { nome: true } },
          usuario: { select: { nome: true } },
          itens: true
        }
      });

      return pedido;
    });

    return NextResponse.json({
      ...pedidoAtualizado,
      valorTotal: Number(pedidoAtualizado.valorTotal),
      frete: Number(pedidoAtualizado.frete || 0)
    });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Erro ao atualizar o pedido.' 
    }, { status: 500 });
  }
}

// DELETE - Deletar pedido
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // Verificar se o pedido existe e pertence à empresa
    const pedidoExistente = await prisma.pedido.findFirst({
      where: {
        id: params.id,
        empresaId: empresaId,
      }
    });

    if (!pedidoExistente) {
      return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Criar histórico de exclusão
      await tx.historicoPedido.create({
        data: {
          pedidoId: params.id,
          descricao: `Pedido excluído`
        },
      });

      // Deletar histórico
      await tx.historicoPedido.deleteMany({
        where: { pedidoId: params.id }
      });

      // Deletar itens do pedido primeiro (devido à foreign key)
      await tx.itemPedido.deleteMany({
        where: { pedidoId: params.id }
      });

      // Deletar o pedido
      await tx.pedido.delete({
        where: { id: params.id }
      });
    });

    return NextResponse.json({ message: 'Pedido deletado com sucesso' });
  } catch (error) {
    console.error("Erro ao deletar pedido:", error);
    return NextResponse.json({ message: 'Erro ao deletar o pedido.' }, { status: 500 });
  }
}
