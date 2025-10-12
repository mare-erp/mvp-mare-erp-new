import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { StatusTransacao, TipoTransacao } from '@prisma/client';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const proximaSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

    const aReceber = await prisma.transacaoFinanceira.aggregate({
      _sum: { valor: true },
      where: { empresaId, tipo: TipoTransacao.RECEITA, status: StatusTransacao.PENDENTE },
    });

    const aPagar = await prisma.transacaoFinanceira.aggregate({
      _sum: { valor: true },
      where: { empresaId, tipo: TipoTransacao.DESPESA, status: StatusTransacao.PENDENTE },
    });

    const receitasPagasMes = await prisma.transacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: { empresaId, tipo: TipoTransacao.RECEITA, status: StatusTransacao.PAGA, dataPagamento: { gte: inicioMes, lte: fimMes } },
    });

    const despesasPagasMes = await prisma.transacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: { empresaId, tipo: TipoTransacao.DESPESA, status: StatusTransacao.PAGA, dataPagamento: { gte: inicioMes, lte: fimMes } },
    });

    const contasVencendo = await prisma.transacaoFinanceira.count({
        where: { empresaId, status: StatusTransacao.PENDENTE, dataVencimento: { lte: proximaSemana, gte: hoje } },
    });

    const summary = {
      aReceber: aReceber._sum.valor || 0,
      aPagar: aPagar._sum.valor || 0,
      saldoMes: (receitasPagasMes._sum.valor || 0) - (despesasPagasMes._sum.valor || 0),
      contasVencendo: contasVencendo || 0,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, { requireCompany: true });
