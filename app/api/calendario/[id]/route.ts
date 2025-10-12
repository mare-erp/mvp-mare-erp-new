'use client';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

// PUT /api/calendario/[id] - Atualizar um evento
async function putHandler(req: NextRequest, { params }: { params: { id: string } }, context: AuthContext) {
  try {
    const { id } = params;
    const body = await req.json();

    const event = await prisma.calendarEvent.findFirst({
      where: { id, organizacaoId: context.organizacaoId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/calendario/[id] - Excluir um evento
async function deleteHandler(req: NextRequest, { params }: { params: { id: string } }, context: AuthContext) {
  try {
    const { id } = params;

    const event = await prisma.calendarEvent.findFirst({
      where: { id, organizacaoId: context.organizacaoId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);