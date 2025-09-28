
// app/api/clientes/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';
import { TipoPessoa } from '@prisma/client';

interface TokenPayload {
  empresaId: string;
}

// MUDANÇA: Schema atualizado para refletir a nova estrutura do Cliente no DB
const clienteSchema = z.object({
  nome: z.string().min(2, 'O Nome / Razão Social é obrigatório.'),
  tipoPessoa: z.nativeEnum(TipoPessoa),
  cpfCnpj: z.string().optional(),
  email: z.string().email('Formato de e-mail inválido.').optional().or(z.literal('')) as z.ZodOptional<z.ZodString>,
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
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    const clientes = await prisma.cliente.findMany({
      where: { empresaId: empresaId },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar clientes.' }, { status: 500 });
  }
}

// POST para criar um novo cliente (agora reflete o schema atualizado)
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    const body = await request.json();
    const validation = clienteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const data = validation.data;

    // Lógica para evitar duplicidade de CPF/CNPJ se ele for fornecido
    if (data.cpfCnpj) {
        const existingCliente = await prisma.cliente.findFirst({
            where: { cpfCnpj: data.cpfCnpj, empresaId: empresaId }
        });
        if (existingCliente) {
            return NextResponse.json({ message: 'Um cliente com este CPF/CNPJ já existe.' }, { status: 409 });
        }
    }
    
    const novoCliente = await prisma.cliente.create({
      data: {
        ...data,
        empresaId: empresaId,
      },
    });

    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao criar o cliente.' }, { status: 500 });
  }
}

