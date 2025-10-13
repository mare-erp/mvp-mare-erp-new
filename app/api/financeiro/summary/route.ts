import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { StatusTransacao, TipoTransacao } from '@prisma/client';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não selecionada' }, { status: 400 });
    }

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

    const totalReceber = Number(aReceber._sum.valor ?? 0);
    const totalPagar = Number(aPagar._sum.valor ?? 0);
    const totalReceitasMes = Number(receitasPagasMes._sum.valor ?? 0);
    const totalDespesasMes = Number(despesasPagasMes._sum.valor ?? 0);

    const summary = {
      aReceber: totalReceber,
      aPagar: totalPagar,
      saldoMes: totalReceitasMes - totalDespesasMes,
      contasVencendo: contasVencendo || 0,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, { requireCompany: true });
