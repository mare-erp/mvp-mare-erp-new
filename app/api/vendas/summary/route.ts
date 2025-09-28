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
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Definir período padrão se não fornecido
    const inicio = dataInicio ? new Date(dataInicio) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fim = dataFim ? new Date(dataFim) : new Date();

    // Buscar pedidos no período
    const pedidos = await prisma.pedido.findMany({
      where: {
        empresaId,
        dataPedido: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        vendedor: { select: { id: true, nome: true } },
        itens: true,
      },
    });

    // Calcular métricas
    const vendas = pedidos.filter(p => p.status === StatusPedido.VENDIDO);
    const orcamentos = pedidos.filter(p => p.status === StatusPedido.ORCAMENTO);
    const recusados = pedidos.filter(p => p.status === StatusPedido.RECUSADO);
    const pendentes = pedidos.filter(p => p.status === StatusPedido.PENDENTE);

    const totalVendas = vendas.reduce((acc, p) => acc + Number(p.valorTotal), 0);
    const totalOrcamentos = orcamentos.reduce((acc, p) => acc + Number(p.valorTotal), 0);
    
    const ticketMedioVendas = vendas.length > 0 ? totalVendas / vendas.length : 0;
    const ticketMedioOrcamentos = orcamentos.length > 0 ? totalOrcamentos / orcamentos.length : 0;

    // Vendas do dia atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const vendasHoje = await prisma.pedido.findMany({
      where: {
        empresaId,
        status: StatusPedido.VENDIDO,
        dataPedido: {
          gte: hoje,
          lt: amanha,
        },
      },
    });

    const orcamentosHoje = await prisma.pedido.findMany({
      where: {
        empresaId,
        status: StatusPedido.ORCAMENTO,
        dataPedido: {
          gte: hoje,
          lt: amanha,
        },
      },
    });

    const valorVendasHoje = vendasHoje.reduce((acc, p) => acc + Number(p.valorTotal), 0);
    const valorOrcamentosHoje = orcamentosHoje.reduce((acc, p) => acc + Number(p.valorTotal), 0);

    const summary = {
      VENDIDO: {
        count: vendas.length,
        total: totalVendas,
      },
      ORCAMENTO: {
        count: orcamentos.length,
        total: totalOrcamentos,
      },
      RECUSADO: {
        count: recusados.length,
        total: recusados.reduce((acc, p) => acc + Number(p.valorTotal), 0),
      },
      PENDENTE: {
        count: pendentes.length,
        total: pendentes.reduce((acc, p) => acc + Number(p.valorTotal), 0),
      },
      periodo: {
        inicio: inicio.toISOString().split('T')[0],
        fim: fim.toISOString().split('T')[0],
      },
      hoje: {
        vendas: {
          quantidade: vendasHoje.length,
          valor: valorVendasHoje,
        },
        orcamentos: {
          quantidade: orcamentosHoje.length,
          valor: valorOrcamentosHoje,
        },
      },
      pedidos: pedidos.map(pedido => ({
        ...pedido,
        valorTotal: Number(pedido.valorTotal),
        itens: pedido.itens.map(item => ({
          ...item,
          precoUnitario: Number(item.precoUnitario),
          subtotal: Number(item.subtotal || 0),
        })),
      })),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Erro ao buscar resumo de vendas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
