import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';
import { withAuth, AuthContext } from '@/app/lib/auth';

const updateEmpresaSchema = z.object({
  nome: z.string().min(2, "O nome da empresa é obrigatório."),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
});

async function getHandler(req: NextRequest, context: AuthContext) {
  try {
    if (!context.empresaId) {
      return NextResponse.json({ message: 'Nenhuma empresa selecionada.' }, { status: 400 });
    }
    const empresa = await prisma.empresa.findUnique({
      where: { id: context.empresaId },
    });

    if (!empresa) {
      return NextResponse.json({ message: 'Empresa não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(empresa);
  } catch (error) {
    console.error('[API Empresa GET]', error);
    return NextResponse.json({ message: 'Erro ao buscar dados da empresa.' }, { status: 500 });
  }
}

async function putHandler(req: NextRequest, context: AuthContext) {
  try {
    if (!context.empresaId) {
      return NextResponse.json({ message: 'Nenhuma empresa selecionada para atualizar.' }, { status: 400 });
    }

    const body = await req.json();
    const validation = updateEmpresaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const data = validation.data;

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: context.empresaId },
      data: {
        nome: data.nome,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        email: data.email || null,
        cep: data.cep || null,
        rua: data.rua || null,
        numero: data.numero || null,
        complemento: data.complemento || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        uf: data.uf || null,
      },
    });

    return NextResponse.json(empresaAtualizada);
  } catch (error) {
    console.error('[API Empresa PUT]', error);
    return NextResponse.json({ message: 'Erro ao atualizar dados da empresa.' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, { requireCompany: true });
export const PUT = withAuth(putHandler, { requireCompany: true });
