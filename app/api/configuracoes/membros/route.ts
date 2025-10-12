import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { RoleOrganizacao } from '@prisma/client';

const inviteSchema = z.object({
  email: z.string().email("O e-mail fornecido é inválido."),
  nome: z.string().min(3, "O nome é obrigatório."),
  role: z.nativeEnum(RoleOrganizacao),
});

// GET /api/configuracoes/membros - Listar membros da organização
async function getHandler(req: NextRequest, context: AuthContext) {
  try {
    const membros = await prisma.membroOrganizacao.findMany({
      where: { organizacaoId: context.organizacaoId },
      include: {
        usuario: { select: { id: true, nome: true, email: true, ativo: true } },
      },
      orderBy: { usuario: { nome: 'asc' } },
    });

    // Formata a resposta para o que o front-end pode esperar
    const response = membros.map(m => ({
      id: m.id,
      role: m.role,
      usuario: m.usuario,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar membros:", error);
    return NextResponse.json({ message: 'Erro interno ao buscar membros.' }, { status: 500 });
  }
}

// POST /api/configuracoes/membros - Convidar/adicionar novo membro à organização
async function postHandler(req: NextRequest, context: AuthContext) {
  // Apenas Admins podem adicionar novos membros
  if (context.role !== 'ADMIN' && context.role !== 'GESTOR') {
    return NextResponse.json({ message: 'Ação não permitida.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = inviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, nome, role } = validation.data;

    const novoMembro = await prisma.$transaction(async (tx) => {
      let usuario = await tx.usuario.findUnique({ where: { email } });

      // Se o usuário não existe, cria um novo com uma senha temporária
      if (!usuario) {
        const senhaTemporaria = Math.random().toString(36).slice(-8);
        const senhaHash = await bcrypt.hash(senhaTemporaria, 10);
        console.log(`SENHA TEMPORÁRIA PARA ${email}: ${senhaTemporaria}`);

        usuario = await tx.usuario.create({
          data: { email, nome, senhaHash },
        });
      }

      // Verifica se o usuário já é membro desta organização
      const existingMembership = await tx.membroOrganizacao.findUnique({
        where: { organizacaoId_usuarioId: { organizacaoId: context.organizacaoId, usuarioId: usuario.id } },
      });

      if (existingMembership) {
        throw new Error("Este usuário já faz parte da sua organização.");
      }

      // Cria o vínculo na tabela MembroOrganizacao
      return await tx.membroOrganizacao.create({
        data: { usuarioId: usuario.id, organizacaoId: context.organizacaoId, role },
        include: { usuario: { select: { nome: true, email: true } } },
      });
    });

    return NextResponse.json(novoMembro, { status: 201 });

  } catch (error: any) {
    if (error.message.includes("já faz parte")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Erro ao criar membro:", error);
    return NextResponse.json({ message: 'Erro ao processar o convite.' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
