import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';

async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;
    if (!empresaId) {
      return NextResponse.json(
        { error: 'Empresa não selecionada' },
        { status: 400 }
      );
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: any = { empresaId };
    
    if (tipo && (tipo === 'RECEITA' || tipo === 'DESPESA')) {
      where.tipo = tipo;
    }
    
    if (status && ['PENDENTE', 'PAGA', 'ATRASADA', 'CANCELADA'].includes(status)) {
      where.status = status;
    }

    const transacoes = await prisma.transacaoFinanceira.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        dataVencimento: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await prisma.transacaoFinanceira.count({ where });

    return NextResponse.json({
      transacoes: transacoes.map(transacao => ({
        ...transacao,
        valor: Number(transacao.valor),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest, context: AuthContext) {
  try {
    const { empresaId } = context;
    if (!empresaId) {
      return NextResponse.json(
        { error: 'Empresa não selecionada' },
        { status: 400 }
      );
    }
    const body = await request.json();

    const {
      descricao,
      valor,
      tipo,
      status,
      dataVencimento,
      dataPagamento,
      observacoes,
      categoria,
      clienteId,
      contaBancariaId,
    } = body;

    // Validações
    if (!descricao || !valor || !tipo || !dataVencimento) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: descricao, valor, tipo, dataVencimento' },
        { status: 400 }
      );
    }

    if (!['RECEITA', 'DESPESA'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo deve ser RECEITA ou DESPESA' },
        { status: 400 }
      );
    }

    const transacao = await prisma.transacaoFinanceira.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        status: status || 'PENDENTE',
        dataVencimento: new Date(dataVencimento),
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
        observacoes,
        categoria,
        empresaId,
        clienteId: clienteId || null,
        contaBancariaId: contaBancariaId || null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...transacao,
      valor: Number(transacao.valor),
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Protegendo as rotas com o novo HOC de autenticação
export const GET = withAuth(getHandler, {
  // Exige que o usuário esteja associado a uma empresa para acessar esta rota
  requireCompany: true,
});

export const POST = withAuth(postHandler, {
  requireCompany: true,
});
