import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { z } from 'zod';
import { TipoPessoa } from '@prisma/client';

const clienteSchema = z.object({
  empresaId: z.string(),
  nome: z.string().min(2, 'O Nome / Razão Social é obrigatório.'),
  tipoPessoa: z.nativeEnum(TipoPessoa),
  cpfCnpj: z.string().optional(),
  email: z.string().email('Formato de e-mail inválido.').optional().or(z.literal('')),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
}).refine((data) => {
    if (data.tipoPessoa === 'JURIDICA') {
        return !!data.cpfCnpj && data.cpfCnpj.length > 0;
    }
    return true;
}, {
    message: "O CNPJ é obrigatório para Pessoa Jurídica.",
    path: ["cpfCnpj"],
});

async function getHandler(req: NextRequest, context: AuthContext) {
  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get('empresaId');

  let whereClause: any = {};

  if (empresaId) {
    const hasAccess = await prisma.empresa.findFirst({ where: { id: empresaId, organizacaoId: context.organizacaoId }});
    if (!hasAccess) {
        return NextResponse.json({ message: 'Acesso negado a esta empresa.' }, { status: 403 });
    }
    whereClause.empresaId = empresaId;
  } else {
    const org = await prisma.organizacao.findUnique({
        where: { id: context.organizacaoId },
        include: { empresas: { select: { id: true } } }
    });
    if (!org) return NextResponse.json([]);
    const empresaIds = org.empresas.map(e => e.id);
    whereClause.empresaId = { in: empresaIds };
  }

  const clientes = await prisma.cliente.findMany({
    where: whereClause,
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(clientes);
}

async function postHandler(req: NextRequest, context: AuthContext) {
  const body = await req.json();
  const validation = clienteSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
  }
  
  const { empresaId, ...data } = validation.data;

  const hasAccess = await prisma.empresa.findFirst({ where: { id: empresaId, organizacaoId: context.organizacaoId }});
  if (!hasAccess) {
    return NextResponse.json({ message: 'Acesso negado para criar cliente nesta empresa.' }, { status: 403 });
  }

  if (data.cpfCnpj) {
      const existingCliente = await prisma.cliente.findFirst({
          where: { cpfCnpj: data.cpfCnpj, empresaId: empresaId }
      });
      if (existingCliente) {
          return NextResponse.json({ message: 'Um cliente com este CPF/CNPJ já existe nesta empresa.' }, { status: 409 });
      }
  }
  
  const novoCliente = await prisma.cliente.create({
    data: {
      ...data,
      empresaId: empresaId,
    },
  });

  return NextResponse.json(novoCliente, { status: 201 });
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
