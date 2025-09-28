import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { TipoItem } from '@prisma/client';

interface TokenPayload {
  empresaId: string;
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const produtos = await prisma.produto.findMany({
      where: { empresaId, ativo: true },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(produtos.map(produto => ({
      ...produto,
      preco: Number(produto.preco),
      custo: Number(produto.custo || 0),
    })));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const { nome, descricao, preco, tipo, quantidadeEstoque, custo, estoqueMinimo, estoqueMaximo } = await request.json();

    if (!nome || !preco) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar SKU automaticamente se não fornecido
    const sku = `${tipo === TipoItem.PRODUTO ? 'PROD' : 'SERV'}-${Date.now()}`;

    const novoProduto = await prisma.produto.create({
      data: {
        nome,
        descricao: descricao || null,
        preco: parseFloat(preco),
        tipo: tipo || TipoItem.PRODUTO,
        sku,
        quantidadeEstoque: tipo === TipoItem.PRODUTO ? (quantidadeEstoque || 0) : null,
        custo: custo ? parseFloat(custo) : 0,
        estoqueMinimo: estoqueMinimo || 0,
        estoqueMaximo: estoqueMaximo || 0,
        empresaId
      }
    });

    return NextResponse.json({
      ...novoProduto,
      preco: Number(novoProduto.preco),
      custo: Number(novoProduto.custo || 0),
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

