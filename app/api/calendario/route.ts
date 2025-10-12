import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

// GET /api/calendario - Listar eventos com filtros
async function getHandler(req: NextRequest, context: AuthContext) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const userId = searchParams.get('userId');

  try {
    const where: any = {
      organizacaoId: context.organizacaoId,
    };

    if (start && end) {
      where.OR = [
        { start: { gte: new Date(start) }, end: { lte: new Date(end) } },
        { start: { lte: new Date(end) }, end: { gte: new Date(start) } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        user: { select: { id: true, nome: true, fotoPerfil: true } },
        stage: true,
        pedido: { select: { id: true, numeroPedido: true } },
      },
      orderBy: {
        start: 'asc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/calendario - Criar um novo evento
async function postHandler(req: NextRequest, context: AuthContext) {
  try {
    const body = await req.json();
    const { title, start, end, description, allDay, recurrence, stageId, pedidoId, userId } = body;

    if (!title || !start || !end) {
      return NextResponse.json({ error: 'Título, início e fim são obrigatórios' }, { status: 400 });
    }

    const targetUserId = userId || context.userId;

    const newEvent = await prisma.calendarEvent.create({
      data: {
        title,
        start: new Date(start),
        end: new Date(end),
        description,
        allDay,
        recurrence,
        stageId,
        pedidoId,
        userId: targetUserId,
        organizacaoId: context.organizacaoId,
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar evento no calendário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
