import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const totalClientes = await prisma.cliente.count({ where: { empresaId } });
    const novosClientesMes = await prisma.cliente.count({ where: { empresaId, createdAt: { gte: inicioMes } } });
    const clientesAtivos = await prisma.cliente.count({ where: { empresaId, ativo: true } });
    const clientesInativos = await prisma.cliente.count({ where: { empresaId, ativo: false } });

    const summary = {
      total: totalClientes,
      novos: novosClientesMes,
      ativos: clientesAtivos,
      inativos: clientesInativos,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Erro ao buscar resumo de clientes:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, { requireCompany: true });
