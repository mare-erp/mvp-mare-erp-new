import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Obter o último número de pedido da empresa
    const lastPedido = await prisma.pedido.findFirst({
      orderBy: {
        numeroPedido: 'desc'
      },
      select: {
        numeroPedido: true
      }
    });

    const nextNumber = lastPedido ? lastPedido.numeroPedido + 1 : 1;

    return NextResponse.json({ nextNumber });
  } catch (error) {
    console.error('Erro ao obter próximo número:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

