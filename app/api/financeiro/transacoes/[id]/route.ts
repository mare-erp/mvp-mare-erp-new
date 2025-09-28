
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth } from '@/app/lib/verifyAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { empresaId } = authResult;
    const { id } = params;

    const transacao = await prisma.transacaoFinanceira.findFirst({
      where: {
        id,
        empresaId,
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

    if (!transacao) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...transacao,
      valor: Number(transacao.valor),
    });
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { empresaId } = authResult;
    const { id } = params;
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

    // Verificar se a transação existe e pertence à empresa
    const transacaoExistente = await prisma.transacaoFinanceira.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!transacaoExistente) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

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

    const transacao = await prisma.transacaoFinanceira.update({
      where: { id },
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        status: status || 'PENDENTE',
        dataVencimento: new Date(dataVencimento),
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
        observacoes,
        categoria,
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
    });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { empresaId } = authResult;
    const { id } = params;

    // Verificar se a transação existe e pertence à empresa
    const transacaoExistente = await prisma.transacaoFinanceira.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!transacaoExistente) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    await prisma.transacaoFinanceira.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Transação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

