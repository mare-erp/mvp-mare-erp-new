import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { organizacaoId } = context;

    const stages = await prisma.kanbanStage.findMany({
      where: { organizacaoId },
      orderBy: { ordem: 'asc' },
    });

    const completedStageId = stages.length > 0 ? stages[stages.length - 1].id : null;

    const allEvents = await prisma.calendarEvent.findMany({ where: { organizacaoId } });

    const totalTarefas = allEvents.length;
    
    const tarefasPendentes = allEvents.filter(e => e.stageId !== completedStageId);
    const tarefasConcluidas = allEvents.filter(e => e.stageId === completedStageId);

    const tempoTotalPrevisto = tarefasPendentes.reduce((acc, event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // in hours
      return acc + duration;
    }, 0);

    const summary = {
      total: totalTarefas,
      pendentes: tarefasPendentes.length,
      concluidas: tarefasConcluidas.length,
      tempoPrevisto: tempoTotalPrevisto,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Erro ao buscar resumo do calendário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
