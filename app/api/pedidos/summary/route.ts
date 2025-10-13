// app/api/pedidos/summary/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import { StatusPedido } from '@prisma/client';

interface TokenPayload { empresaId: string; }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // Constrói o filtro dinamicamente
    const whereClause: any = {
      empresaId: empresaId,
      ...(usuarioId && { usuarioId: usuarioId }),
      ...(dataInicio && dataFim && { 
        dataPedido: { 
          gte: new Date(dataInicio), 
          lte: new Date(dataFim) 
        } 
      }),
    };

    const stats = await prisma.pedido.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { _all: true },
      _sum: { valorTotal: true },
    });

    const summary: Record<StatusPedido, { count: number; total: number }> = {
      [StatusPedido.VENDIDO]: { count: 0, total: 0 },
      [StatusPedido.ORCAMENTO]: { count: 0, total: 0 },
      [StatusPedido.RECUSADO]: { count: 0, total: 0 },
      [StatusPedido.PENDENTE]: { count: 0, total: 0 },
    };

    stats.forEach((stat) => {
      summary[stat.status as StatusPedido] = {
        count: stat._count._all,
        total: Number(stat._sum.valorTotal) || 0,
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar resumo de vendas.' }, { status: 500 });
  }
}
