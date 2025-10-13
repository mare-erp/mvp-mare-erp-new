import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, logAuditoria } from '@/app/lib/auth';

// GET - Listar organizações do usuário
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const organizacoes = await prisma.membroOrganizacao.findMany({
      where: {
        usuarioId: context.userId,
        ativo: true
      },
      include: {
        organizacao: {
          include: {
            empresas: {
              where: { ativa: true },
              select: {
                id: true,
                nome: true,
                cnpj: true,
                logoUrl: true
              }
            },
            _count: {
              select: {
                membros: {
                  where: { ativo: true }
                }
              }
            }
          }
        }
      }
    });

    const resultado = organizacoes.map(membro => ({
      id: membro.organizacao.id,
      nome: membro.organizacao.nome,
      role: membro.role,
      empresas: membro.organizacao.empresas,
      totalMembros: membro.organizacao._count.membros,
      isAdmin: membro.organizacao.adminId === context.userId
    }));

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('Erro ao listar organizações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar nova organização
export const POST = withAuth(async (req: NextRequest, context) => {
  try {
    const { nome, nomeEmpresa, cnpj } = await req.json();

    if (!nome || !nomeEmpresa) {
      return NextResponse.json(
        { error: 'Nome da organização e nome da empresa são obrigatórios' },
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

    // Transação para criar organização e empresa
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar organização
      const organizacao = await tx.organizacao.create({
        data: {
          nome,
          adminId: context.userId
        }
      });

      // Criar empresa
      const empresa = await tx.empresa.create({
        data: {
          nome: nomeEmpresa,
          cnpj: cnpj || null,
          organizacaoId: organizacao.id
        }
      });

      // Criar membro da organização (admin)
      await tx.membroOrganizacao.create({
        data: {
          organizacaoId: organizacao.id,
          usuarioId: context.userId,
          role: 'ADMIN'
        }
      });

      return { organizacao, empresa };
    });

    // Log de auditoria
    await logAuditoria(
      context.userId,
      resultado.organizacao.id,
      resultado.empresa.id,
      'CRIAR',
      'Organizacao',
      resultado.organizacao.id,
      { nome, nomeEmpresa, cnpj },
      req
    );

    return NextResponse.json({
      message: 'Organização criada com sucesso',
      organizacao: {
        id: resultado.organizacao.id,
        nome: resultado.organizacao.nome,
        empresa: {
          id: resultado.empresa.id,
          nome: resultado.empresa.nome,
          cnpj: resultado.empresa.cnpj
        }
      }
    });

  } catch (error) {
    console.error('Erro ao criar organização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
