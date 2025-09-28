import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, logAuditoria } from '@/app/lib/verifyAuth';

// GET - Listar empresas da organização
export const GET = withAuth(
  async (req: NextRequest, context, { params }: { params: { id: string } }) => {
    try {
      const organizacaoId = params.id;

      // Verificar se usuário tem acesso à organização
      if (context.organizacaoId !== organizacaoId) {
        return NextResponse.json(
          { error: 'Acesso negado à organização' },
          { status: 403 }
        );
      }

      const empresas = await prisma.empresa.findMany({
        where: {
          organizacaoId,
          ativa: true
        },
        include: {
          _count: {
            select: {
              clientes: true,
              produtos: true,
              pedidos: true
            }
          }
        },
        orderBy: { nome: 'asc' }
      });

      const resultado = empresas.map(empresa => ({
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj,
        logoUrl: empresa.logoUrl,
        endereco: empresa.endereco,
        telefone: empresa.telefone,
        email: empresa.email,
        createdAt: empresa.createdAt,
        estatisticas: {
          totalClientes: empresa._count.clientes,
          totalProdutos: empresa._count.produtos,
          totalPedidos: empresa._count.pedidos
        }
      }));

      return NextResponse.json(resultado);

    } catch (error) {
      console.error('Erro ao listar empresas:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  }
);

// POST - Criar nova empresa
export const POST = withAuth(
  async (req: NextRequest, context, { params }: { params: { id: string } }) => {
    try {
      const organizacaoId = params.id;
      const { nome, cnpj, endereco, telefone, email } = await req.json();

      // Verificar se usuário tem acesso à organização
      if (context.organizacaoId !== organizacaoId) {
        return NextResponse.json(
          { error: 'Acesso negado à organização' },
          { status: 403 }
        );
      }

      if (!nome) {
        return NextResponse.json(
          { error: 'Nome da empresa é obrigatório' },
          { status: 400 }
        );
      }

      // Verificar se CNPJ já existe (se fornecido)
      if (cnpj) {
        const empresaExistente = await prisma.empresa.findUnique({
          where: { cnpj }
        });

        if (empresaExistente) {
          return NextResponse.json(
            { error: 'CNPJ já está em uso' },
            { status: 400 }
          );
        }
      }

      // Criar empresa
      const novaEmpresa = await prisma.empresa.create({
        data: {
          nome,
          cnpj: cnpj || null,
          endereco: endereco || null,
          telefone: telefone || null,
          email: email || null,
          organizacaoId
        }
      });

      // Log de auditoria
      await logAuditoria(
        context.userId,
        organizacaoId,
        novaEmpresa.id,
        'CRIAR',
        'Empresa',
        novaEmpresa.id,
        { nome, cnpj },
        req
      );

      return NextResponse.json({
        message: 'Empresa criada com sucesso',
        empresa: {
          id: novaEmpresa.id,
          nome: novaEmpresa.nome,
          cnpj: novaEmpresa.cnpj,
          endereco: novaEmpresa.endereco,
          telefone: novaEmpresa.telefone,
          email: novaEmpresa.email
        }
      });

    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: { modulo: 'configuracoes', acao: 'empresa' } }
);

