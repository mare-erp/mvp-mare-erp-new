import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth } from '@/app/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status ?? 401 }
      );
    }

    const { userId } = authResult;
    const { id: organizacaoId } = params;

    // Verificar se o usuário pertence à organização
    const membro = await prisma.membroOrganizacao.findFirst({
      where: {
        organizacaoId,
        usuarioId: userId,
      },
    });

    if (!membro) {
      return NextResponse.json(
        { error: 'Acesso negado à organização' },
        { status: 403 }
      );
    }

    // Buscar empresas da organização
    const empresas = await prisma.empresa.findMany({
      where: {
        organizacaoId,
        ativa: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status ?? 401 }
      );
    }

    const { userId } = authResult;
    const { id: organizacaoId } = params;
    const body = await request.json();

    const { nome, cnpj, email, telefone, cep, rua, numero, complemento, bairro, cidade, uf } = body;

    // Verificar se o usuário tem permissão para criar empresas na organização
    const membro = await prisma.membroOrganizacao.findFirst({
      where: {
        organizacaoId,
        usuarioId: userId,
        role: { in: ['ADMIN', 'GESTOR'] },
      },
    });

    if (!membro) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para criar empresas' },
        { status: 403 }
      );
    }

    // Validações
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se CNPJ já existe (se fornecido)
    if (cnpj) {
      const existingCnpj = await prisma.empresa.findFirst({
        where: {
          cnpj,
          ativa: true,
        },
      });

      if (existingCnpj) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado para outra empresa' },
          { status: 400 }
        );
      }
    }

    // Criar empresa
    const empresa = await prisma.empresa.create({
      data: {
        nome,
        cnpj,
        email,
        telefone,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        organizacaoId,
      },
    });

    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
