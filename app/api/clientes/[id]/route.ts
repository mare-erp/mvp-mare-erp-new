
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';
import { TipoPessoa } from '@prisma/client';
import { withAuth, AuthContext } from '@/app/lib/auth';

const clienteSchema = z.object({
  nome: z.string().min(2, 'O Nome / Razão Social é obrigatório.').optional(),
  tipoPessoa: z.nativeEnum(TipoPessoa).optional(),
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
    if (data.tipoPessoa === 'JURIDICA' && !data.cpfCnpj) {
        return false;
    }
    return true;
}, {
    message: "O CNPJ é obrigatório para Pessoa Jurídica.",
    path: ["cpfCnpj"],
});

async function getHandler(request: NextRequest, context: AuthContext, params?: { id: string }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ message: 'ID do cliente não informado.' }, { status: 400 });
    }
    if (!context.empresaId) {
      return NextResponse.json({ message: 'Empresa não selecionada.' }, { status: 400 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id, empresaId: context.empresaId },
    });

    if (!cliente) {
      return NextResponse.json({ message: 'Cliente não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

async function putHandler(request: NextRequest, context: AuthContext, params?: { id: string }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ message: 'ID do cliente não informado.' }, { status: 400 });
    }
    if (!context.empresaId) {
      return NextResponse.json({ message: 'Empresa não selecionada.' }, { status: 400 });
    }
    const body = await request.json();
    const validation = clienteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const data = validation.data;

    const existingCliente = await prisma.cliente.findUnique({ where: { id, empresaId: context.empresaId } });
    if (!existingCliente) {
      return NextResponse.json({ message: 'Cliente não encontrado.' }, { status: 404 });
    }

    // Lógica para evitar duplicidade de CPF/CNPJ se ele for fornecido e diferente do atual
    if (data.cpfCnpj && data.cpfCnpj !== existingCliente.cpfCnpj) {
        const duplicateCliente = await prisma.cliente.findFirst({
            where: { cpfCnpj: data.cpfCnpj, empresaId: context.empresaId }
        });
        if (duplicateCliente) {
            return NextResponse.json({ message: 'Um cliente com este CPF/CNPJ já existe.' }, { status: 409 });
        }
    }

    const updatedCliente = await prisma.cliente.update({
      where: { id, empresaId: context.empresaId },
      data: {
        ...data,
        email: data.email === '' ? null : data.email, // Tratar string vazia para email como null
        telefone: data.telefone === '' ? null : data.telefone, // Tratar string vazia para telefone como null
        cpfCnpj: data.cpfCnpj === '' ? null : data.cpfCnpj, // Tratar string vazia para cpfCnpj como null
      },
    });

    return NextResponse.json(updatedCliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

async function deleteHandler(request: NextRequest, context: AuthContext, params?: { id: string }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ message: 'ID do cliente não informado.' }, { status: 400 });
    }
    if (!context.empresaId) {
      return NextResponse.json({ message: 'Empresa não selecionada.' }, { status: 400 });
    }

    const existingCliente = await prisma.cliente.findUnique({ 
      where: { id, empresaId: context.empresaId },
      include: {
        pedidos: true,
      },
    });
    
    if (!existingCliente) {
      return NextResponse.json({ message: 'Cliente não encontrado.' }, { status: 404 });
    }

    // Verificar se o cliente tem pedidos associados
    if (existingCliente.pedidos.length > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir cliente com pedidos associados. Desative o cliente em vez de excluí-lo.' },
        { status: 409 }
      );
    }

    await prisma.cliente.delete({
      where: { id, empresaId: context.empresaId },
    });

    return NextResponse.json({ message: 'Cliente excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export const GET = withAuth(
  (req: NextRequest, context: AuthContext, routeContext?: { params: { id: string } }) =>
    getHandler(req, context, routeContext?.params),
  { requireCompany: true }
);

export const PUT = withAuth(
  (req: NextRequest, context: AuthContext, routeContext?: { params: { id: string } }) =>
    putHandler(req, context, routeContext?.params),
  { requireCompany: true }
);

export const DELETE = withAuth(
  (req: NextRequest, context: AuthContext, routeContext?: { params: { id: string } }) =>
    deleteHandler(req, context, routeContext?.params),
  { requireCompany: true }
);
