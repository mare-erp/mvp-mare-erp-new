// app/api/membros/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Schema para validar os dados de um novo convite
const inviteSchema = z.object({
  email: z.string().email("O e-mail fornecido é inválido."),
  nome: z.string().min(3, "O nome é obrigatório."),
  role: z.enum(['OPERADOR', 'VISUALIZADOR', 'GESTOR']),
});

async function getHandler(req: NextRequest, context: AuthContext) {
  const membros = await prisma.membroOrganizacao.findMany({
    where: { organizacaoId: context.organizacaoId },
    include: {
      usuario: { select: { id: true, nome: true, email: true, ativo: true, ultimoLogin: true } },
    },
    orderBy: {
      usuario: { nome: 'asc' }
    }
  });

  return NextResponse.json(membros);
}

export const GET = withAuth(getHandler);

async function postHandler(req: NextRequest, context: AuthContext) {
  if (context.role !== 'ADMIN' && context.role !== 'GESTOR') {
    return NextResponse.json({ message: 'Ação não permitida. Apenas ADMIN ou GESTOR podem convidar membros.' }, { status: 403 });
  }

  const body = await req.json();
  const validation = inviteSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { email, nome, role } = validation.data;

  try {
    const novoMembro = await prisma.$transaction(async (tx) => {
      let usuario = await tx.usuario.findUnique({ where: { email } });

      if (!usuario) {
        const senhaTemporaria = Math.random().toString(36).slice(-8);
        const senhaHash = await bcrypt.hash(senhaTemporaria, 10);
        
        console.log(`SENHA TEMPORÁRIA PARA ${email}: ${senhaTemporaria}`);

        usuario = await tx.usuario.create({
          data: { email, nome, senhaHash },
        });
      }

      const existingMembership = await tx.membroOrganizacao.findUnique({
        where: { organizacaoId_usuarioId: { organizacaoId: context.organizacaoId, usuarioId: usuario.id } },
      });

      if (existingMembership) {
        throw new Error("Este usuário já faz parte da sua organização.");
      }

      return await tx.membroOrganizacao.create({
        data: { 
          usuarioId: usuario.id, 
          organizacaoId: context.organizacaoId, 
          role 
        },
        include: { usuario: { select: { id: true, nome: true, email: true } } },
      });
    });

    return NextResponse.json(novoMembro, { status: 201 });

  } catch (error: any) {
    if (error.message.includes("já faz parte")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Erro ao convidar membro:", error);
    return NextResponse.json({ message: 'Erro ao processar o convite.' }, { status: 500 });
  }
}

export const POST = withAuth(postHandler);