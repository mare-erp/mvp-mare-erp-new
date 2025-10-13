import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { z } from 'zod';
import { TipoItem } from '@prisma/client';

const produtoSchema = z.object({
  nome: z.string().min(2, 'O nome do item é obrigatório.'),
  descricao: z.string().optional(),
  preco: z.number().nonnegative('O preço não pode ser negativo.'),
  tipo: z.nativeEnum(TipoItem),
  quantidadeEstoque: z.number().int().optional(),
});

// GET /api/produtos - Listar produtos da empresa
async function getHandler(req: NextRequest, context: AuthContext) {
  try {
    if (!context.empresaId) {
      return NextResponse.json({ message: 'Empresa não selecionada.' }, { status: 400 });
    }
    const produtos = await prisma.produto.findMany({
      where: { empresaId: context.empresaId },
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ message: 'Erro interno ao buscar produtos.' }, { status: 500 });
  }
}

// POST /api/produtos - Criar um novo produto/serviço
async function postHandler(req: NextRequest, context: AuthContext) {
  try {
    if (!context.empresaId) {
      return NextResponse.json({ message: 'Empresa não selecionada.' }, { status: 400 });
    }
    const body = await req.json();
    const validation = produtoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = validation.data;

    const novoProduto = await prisma.produto.create({
      data: {
        ...data,
        quantidadeEstoque: data.tipo === 'PRODUTO' ? data.quantidadeEstoque ?? 0 : null,
        empresaId: context.empresaId,
      },
    });

    return NextResponse.json(novoProduto, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ message: 'Erro ao criar o produto.' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, { requireCompany: true });
export const POST = withAuth(postHandler, { requireCompany: true });
