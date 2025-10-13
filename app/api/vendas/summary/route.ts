import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { StatusPedido } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const usuarioId = searchParams.get('usuarioId');

    const where: any = { empresaId };
    if (dataInicio && dataFim) {
      where.dataPedido = { gte: new Date(dataInicio), lte: new Date(`${dataFim}T23:59:59.999Z`) };
    }
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    const summaryData = await prisma.pedido.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { valorTotal: true },
    });

    const summary = {
      VENDIDO: { count: 0, total: 0 },
      ORCAMENTO: { count: 0, total: 0 },
      RECUSADO: { count: 0, total: 0 },
      PENDENTE: { count: 0, total: 0 },
      ALL: { count: 0, total: 0 },
    };

    summaryData.forEach(group => {
      const status = group.status as keyof typeof summary;
      if (summary[status]) {
        summary[status] = { count: group._count.id, total: Number(group._sum.valorTotal) || 0 };
      }
    });
    summary.ALL = { 
        count: summaryData.reduce((acc, group) => acc + group._count.id, 0),
        total: summaryData.reduce((acc, group) => acc + (Number(group._sum.valorTotal) || 0), 0)
    };

    // Temporariamente retornando apenas o summary básico para estabilização
    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Erro ao buscar resumo de vendas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, { requireCompany: true });
