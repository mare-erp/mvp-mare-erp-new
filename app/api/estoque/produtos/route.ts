import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { TipoItem } from '@prisma/client';

async function getHandler(req: NextRequest, context: AuthContext) {
  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get('empresaId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const tipo = searchParams.get('tipo');
  const skip = (page - 1) * limit;

  let where: any = { ativo: true };

  if (empresaId) {
    const hasAccess = await prisma.empresa.findFirst({ where: { id: empresaId, organizacaoId: context.organizacaoId }});
    if (!hasAccess) {
        return NextResponse.json({ message: 'Acesso negado a esta empresa.' }, { status: 403 });
    }
    where.empresaId = empresaId;
  } else {
    const org = await prisma.organizacao.findUnique({
        where: { id: context.organizacaoId },
        include: { empresas: { select: { id: true } } }
    });
    if (!org) return NextResponse.json([]);
    const empresaIds = org.empresas.map(e => e.id);
    where.empresaId = { in: empresaIds };
  }

  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (tipo && (tipo === 'PRODUTO' || tipo === 'SERVICO')) {
    where.tipo = tipo as TipoItem;
  }

  const produtos = await prisma.produto.findMany({
    where,
    orderBy: { nome: 'asc' },
    skip,
    take: limit,
  });

  return NextResponse.json(produtos.map(p => ({
    ...p,
    preco: Number(p.preco),
    custo: Number(p.custo || 0),
    quantidadeEstoque: p.quantidadeEstoque || 0,
  })));
}

async function postHandler(req: NextRequest, context: AuthContext) {
  const body = await req.json();
  const { empresaId, nome, preco, ...rest } = body;

  if (!empresaId || !nome || !preco) {
    return NextResponse.json({ error: 'empresaId, Nome e preço são obrigatórios' }, { status: 400 });
  }

  const hasAccess = await prisma.empresa.findFirst({ where: { id: empresaId, organizacaoId: context.organizacaoId }});
  if (!hasAccess) {
      return NextResponse.json({ message: 'Acesso negado para criar produto nesta empresa.' }, { status: 403 });
  }

  let finalSku = rest.sku;
  if (!finalSku) {
    const count = await prisma.produto.count({ where: { empresaId } });
    finalSku = `${rest.tipo === 'PRODUTO' ? 'PROD' : 'SERV'}${(count + 1).toString().padStart(4, '0')}`;
  }

  const existingSku = await prisma.produto.findFirst({
    where: { empresaId, sku: finalSku, ativo: true },
  });

  if (existingSku) {
    return NextResponse.json({ error: 'SKU já existe para outro produto' }, { status: 400 });
  }

  const produto = await prisma.produto.create({
    data: {
      ...rest,
      nome,
      preco: parseFloat(preco),
      sku: finalSku,
      empresaId,
    },
  });

  if (rest.tipo === 'PRODUTO' && rest.quantidadeEstoque > 0) {
    await prisma.movimentacaoEstoque.create({
      data: {
        produtoId: produto.id,
        tipo: 'ENTRADA',
        quantidade: rest.quantidadeEstoque,
        observacao: 'Estoque inicial',
        empresaId,
      },
    });
  }

  return NextResponse.json({ ...produto, preco: Number(produto.preco), custo: Number(produto.custo || 0) }, { status: 201 });
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
