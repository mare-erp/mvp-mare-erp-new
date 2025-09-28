import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, logAuditoria } from '@/app/lib/verifyAuth';
import bcrypt from 'bcryptjs';

// GET - Listar membros da organização
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

      const membros = await prisma.membroOrganizacao.findMany({
        where: {
          organizacaoId,
          ativo: true
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              fotoPerfil: true,
              ultimoLogin: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { usuario: { nome: 'asc' } }
        ]
      });

      const resultado = membros.map(membro => ({
        id: membro.id,
        role: membro.role,
        permissoes: membro.permissoes,
        createdAt: membro.createdAt,
        usuario: membro.usuario
      }));

      return NextResponse.json(resultado);

    } catch (error) {
      console.error('Erro ao listar membros:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: { modulo: 'usuarios', acao: 'visualizar' } }
);

// POST - Convidar novo membro
export const POST = withAuth(
  async (req: NextRequest, context, { params }: { params: { id: string } }) => {
    try {
      const organizacaoId = params.id;
      const { email, nome, role, permissoes } = await req.json();

      // Verificar se usuário tem acesso à organização
      if (context.organizacaoId !== organizacaoId) {
        return NextResponse.json(
          { error: 'Acesso negado à organização' },
          { status: 403 }
        );
      }

      if (!email || !nome || !role) {
        return NextResponse.json(
          { error: 'Email, nome e role são obrigatórios' },
          { status: 400 }
        );
      }

      // Verificar se usuário já existe
      let usuario = await prisma.usuario.findUnique({
        where: { email: email.toLowerCase() }
      });

      // Se usuário não existe, criar
      if (!usuario) {
        // Gerar senha temporária
        const senhaTemporaria = Math.random().toString(36).slice(-8);
        const senhaHash = await bcrypt.hash(senhaTemporaria, 12);

        usuario = await prisma.usuario.create({
          data: {
            nome,
            email: email.toLowerCase(),
            senhaHash
          }
        });

        // TODO: Enviar email com senha temporária
        console.log(`Senha temporária para ${email}: ${senhaTemporaria}`);
      }

      // Verificar se usuário já é membro da organização
      const membroExistente = await prisma.membroOrganizacao.findUnique({
        where: {
          organizacaoId_usuarioId: {
            organizacaoId,
            usuarioId: usuario.id
          }
        }
      });

      if (membroExistente) {
        return NextResponse.json(
          { error: 'Usuário já é membro desta organização' },
          { status: 400 }
        );
      }

      // Criar membro da organização
      const novoMembro = await prisma.membroOrganizacao.create({
        data: {
          organizacaoId,
          usuarioId: usuario.id,
          role: role as any,
          permissoes: role === 'OPERADOR' ? permissoes : null
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              fotoPerfil: true
            }
          }
        }
      });

      // Log de auditoria
      await logAuditoria(
        context.userId,
        organizacaoId,
        null,
        'CRIAR',
        'MembroOrganizacao',
        novoMembro.id,
        { email, nome, role },
        req
      );

      return NextResponse.json({
        message: 'Membro adicionado com sucesso',
        membro: {
          id: novoMembro.id,
          role: novoMembro.role,
          permissoes: novoMembro.permissoes,
          usuario: novoMembro.usuario
        }
      });

    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: { modulo: 'usuarios', acao: 'criar' } }
);

