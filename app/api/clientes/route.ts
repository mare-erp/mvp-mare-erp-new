// app/api/clientes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';
import { TipoPessoa } from '@prisma/client';
import { withAuth, AuthContext } from '@/app/lib/auth';

// MUDANÇA: Schema atualizado para refletir a nova estrutura do Cliente no DB
const clienteSchema = z.object({
  nome: z.string().min(2, 'O Nome / Razão Social é obrigatório.'),
  tipoPessoa: z.nativeEnum(TipoPessoa),
  cpfCnpj: z.string().optional(),
  email: z.union([z.string().email('Formato de e-mail inválido.'), z.literal('')]).optional(),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
}).refine((data) => {
    // Regra: Se for Pessoa Jurídica, o CNPJ é obrigatório
    if (data.tipoPessoa === 'JURIDICA') {
        return !!data.cpfCnpj && data.cpfCnpj.length > 0;
    }
    return true;
}, {
    message: "O CNPJ é obrigatório para Pessoa Jurídica.",
    path: ["cpfCnpj"],
});

// GET para listar os clientes (agora reflete o schema atualizado)
async function getHandler(request: NextRequest, context: AuthContext) {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { empresaId: context.empresaId },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar clientes.' }, { status: 500 });
  }
}

// POST para criar um novo cliente (agora reflete o schema atualizado)
async function postHandler(request: NextRequest, context: AuthContext) {
  try {
    if (!context.empresaId) {
      return NextResponse.json({ message: 'Empresa não selecionada.' }, { status: 400 });
    }

    const body = await request.json();
    const validation = clienteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const data = validation.data;
    const normalizedData = {
      ...data,
      email: data.email === '' ? null : data.email,
      telefone: data.telefone === '' ? null : data.telefone,
      cpfCnpj: data.cpfCnpj === '' ? null : data.cpfCnpj,
    };

    // Lógica para evitar duplicidade de CPF/CNPJ se ele for fornecido
    if (normalizedData.cpfCnpj) {
        const existingCliente = await prisma.cliente.findFirst({
            where: { cpfCnpj: normalizedData.cpfCnpj, empresaId: context.empresaId }
        });
        if (existingCliente) {
            return NextResponse.json({ message: 'Um cliente com este CPF/CNPJ já existe.' }, { status: 409 });
        }
    }
    
    const novoCliente = await prisma.cliente.create({
      data: {
        ...normalizedData,
        empresaId: context.empresaId,
      },
    });

    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao criar o cliente.' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, {
  requireCompany: true,
});

export const POST = withAuth(postHandler, {
  requireCompany: true,
});
