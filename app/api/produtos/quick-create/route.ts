import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { TipoItem } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { nome, descricao, preco, tipo } = await request.json();

    if (!nome || !preco) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar SKU automaticamente
    const sku = `${tipo === TipoItem.PRODUTO ? 'PROD' : 'SERV'}-${Date.now()}`;

    const novoProduto = await prisma.produto.create({
      data: {
        nome,
        descricao: descricao || null,
        preco: parseFloat(preco),
        tipo: tipo || TipoItem.PRODUTO,
        sku,
        quantidadeEstoque: tipo === TipoItem.PRODUTO ? 0 : null,
        custo: 0,
        estoqueMinimo: 0,
        estoqueMaximo: 0,
        empresaId: '1' // TODO: Pegar da sessão do usuário
      }
    });

    return NextResponse.json(novoProduto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

