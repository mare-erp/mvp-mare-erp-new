import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth } from '@/app/lib/verifyAuth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { empresaId } = authResult;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Buscar transações do mês atual
    const transacoesMes = await prisma.transacaoFinanceira.findMany({
      where: {
        empresaId,
        dataVencimento: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Calcular entradas
    const entradasMes = transacoesMes
      .filter(t => t.tipo === 'RECEITA')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const entradasPendentes = transacoesMes
      .filter(t => t.tipo === 'RECEITA' && t.status === 'PENDENTE')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    // Calcular saídas
    const saidasMes = transacoesMes
      .filter(t => t.tipo === 'DESPESA')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const saidasPendentes = transacoesMes
      .filter(t => t.tipo === 'DESPESA' && t.status === 'PENDENTE')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    // Calcular saldo
    const saldo = entradasMes - saidasMes;

    // Contas vencendo nos próximos 7 dias
    const contasVencendo = await prisma.transacaoFinanceira.count({
      where: {
        empresaId,
        status: 'PENDENTE',
        dataVencimento: {
          gte: now,
          lte: next7Days,
        },
      },
    });

    // Fluxo mensal dos últimos 6 meses
    const fluxoMensal = [];
    for (let i = 5; i >= 0; i--) {
      const mesData = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const proximoMes = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const transacoesMesAtual = await prisma.transacaoFinanceira.findMany({
        where: {
          empresaId,
          dataVencimento: {
            gte: mesData,
            lte: proximoMes,
          },
        },
      });

      const entradas = transacoesMesAtual
        .filter(t => t.tipo === 'RECEITA')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const saidas = transacoesMesAtual
        .filter(t => t.tipo === 'DESPESA')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      fluxoMensal.push({
        mes: mesData.toLocaleDateString('pt-BR', { month: 'short' }),
        entradas,
        saidas,
      });
    }

    const dashboardData = {
      entradas: {
        total: entradasMes,
        mes: entradasMes,
        pendentes: entradasPendentes,
      },
      saidas: {
        total: saidasMes,
        mes: saidasMes,
        pendentes: saidasPendentes,
      },
      saldo,
      contasVencendo,
      fluxoMensal,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard financeiro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

