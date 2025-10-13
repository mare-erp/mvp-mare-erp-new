import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

// POST /api/calendario/[id]/clone - Clonar um evento
async function postHandler(
  req: NextRequest,
  context: AuthContext,
  routeContext?: { params: { id: string } }
) {
  try {
    const eventId = routeContext?.params?.id;
    if (!eventId) {
      return NextResponse.json({ error: 'ID do evento não informado' }, { status: 400 });
    }

    const eventToClone = await prisma.calendarEvent.findFirst({
      where: { id: eventId, organizacaoId: context.organizacaoId },
    });

    if (!eventToClone) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const { id: _, ...cloneData } = eventToClone;

    const newEvent = await prisma.calendarEvent.create({
      data: {
        ...cloneData,
        title: `${cloneData.title} (Cópia)`,
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Erro ao clonar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withAuth(postHandler);
