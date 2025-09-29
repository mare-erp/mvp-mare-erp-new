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
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const usuarioId = searchParams.get('usuarioId');

    const where: any = {
      empresaId,
    };

    if (dataInicio && dataFim) {
      where.dataPedido = {
        gte: new Date(dataInicio),
        lte: new Date(`${dataFim}T23:59:59.999Z`),
      };
    }

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    const summaryData = await prisma.pedido.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        valorTotal: true,
      },
    });

    const summary = {
      VENDIDO: { count: 0, total: 0 },
      ORCAMENTO: { count: 0, total: 0 },
      RECUSADO: { count: 0, total: 0 },
      PENDENTE: { count: 0, total: 0 },
    };

    for (const group of summaryData) {
      const status = group.status as keyof typeof summary;
      if (summary[status]) {
        summary[status] = {
          count: group._count.id,
          total: Number(group._sum.valorTotal) || 0,
        };
      }
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Erro ao buscar resumo de vendas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
