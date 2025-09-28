import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { TipoPessoa } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { nome, cpfCnpj, tipoPessoa } = await request.json();

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe um cliente com o mesmo CPF/CNPJ (se fornecido)
    if (cpfCnpj) {
      const existingCliente = await prisma.cliente.findFirst({
        where: {
          cpfCnpj: cpfCnpj
        }
      });

      if (existingCliente) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este CPF/CNPJ' },
          { status: 400 }
        );
      }
    }

    // Determinar o tipo de pessoa baseado no CPF/CNPJ ou usar o fornecido
    let tipo = tipoPessoa;
    if (!tipo && cpfCnpj) {
      // Se CPF/CNPJ tem 11 dígitos (apenas números), é pessoa física
      // Se tem 14 dígitos, é pessoa jurídica
      const apenasNumeros = cpfCnpj.replace(/\D/g, '');
      tipo = apenasNumeros.length === 11 ? TipoPessoa.FISICA : TipoPessoa.JURIDICA;
    } else if (!tipo) {
      tipo = TipoPessoa.FISICA; // Padrão
    }

    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        cpfCnpj: cpfCnpj || null,
        tipoPessoa: tipo,
        empresaId: '1' // TODO: Pegar da sessão do usuário
      }
    });

    return NextResponse.json(novoCliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

