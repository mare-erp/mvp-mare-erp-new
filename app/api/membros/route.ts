import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { withAuth, AuthContext } from '@/app/lib/auth';
import { RoleOrganizacao } from '@prisma/client';

const inviteSchema = z.object({
  email: z.string().email("O e-mail fornecido é inválido."),
  nome: z.string().min(3, "O nome é obrigatório."),
  role: z.enum(['OPERADOR', 'VISUALIZADOR']),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").optional().or(z.literal('')),
});

// GET para listar membros da organização
async function getHandler(req: NextRequest, context: AuthContext) {
  try {
    const membros = await prisma.membroOrganizacao.findMany({
      where: { organizacaoId: context.organizacaoId },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
      orderBy: {
        usuario: { nome: 'asc' }
      }
    });
    return NextResponse.json(membros);
  } catch (error) {
    console.error('[API Membros GET]', error);
    return NextResponse.json({ message: 'Erro ao buscar membros da equipe.' }, { status: 500 });
  }
}

// POST para convidar um novo membro
async function postHandler(req: NextRequest, context: AuthContext) {
  try {
    // Apenas ADMIN e GESTOR podem convidar
    if (context.role !== 'ADMIN' && context.role !== 'GESTOR') {
      return NextResponse.json({ message: 'Ação não permitida.' }, { status: 403 });
    }

    const body = await req.json();
    const validation = inviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, nome, role, senha } = validation.data;

    const novoMembro = await prisma.$transaction(async (tx) => {
      let usuario = await tx.usuario.findUnique({ where: { email } });

      if (!usuario) {
        const senhaParaSalvar = (senha && senha.length >= 6) ? senha : Math.random().toString(36).slice(-8);
        const senhaHash = await bcrypt.hash(senhaParaSalvar, 10);
        
        if (!senha || senha.length < 6) {
          console.log(`SENHA TEMPORÁRIA PARA ${email}: ${senhaParaSalvar}`);
        }
        usuario = await tx.usuario.create({
          data: { email, nome, senhaHash, ativo: true },
        });
      }

      const existingMembership = await tx.membroOrganizacao.findUnique({
        where: { organizacaoId_usuarioId: { organizacaoId: context.organizacaoId, usuarioId: usuario.id } },
      });
      if (existingMembership) {
        throw new Error("Este usuário já faz parte da sua equipe.");
      }

      return await tx.membroOrganizacao.create({
        data: { usuarioId: usuario.id, organizacaoId: context.organizacaoId, role: role as RoleOrganizacao, ativo: true },
        include: { usuario: { select: { id: true, nome: true, email: true } } },
      });
    });

    return NextResponse.json(novoMembro, { status: 201 });

  } catch (error: any) {
    if (error.message.includes("já faz parte")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error('[API Membros POST]', error);
    return NextResponse.json({ message: 'Erro ao processar o convite.' }, { status: 500 });
  }
}

// DELETE para remover um membro
async function deleteHandler(req: NextRequest, context: AuthContext) {
    const membroId = req.nextUrl.pathname.split('/').pop(); // Extrai o ID da URL
    
    if (!membroId) {
        return NextResponse.json({ message: 'ID do membro não fornecido.' }, { status: 400 });
    }

    try {
        // Apenas ADMIN e GESTOR podem remover
        if (context.role !== 'ADMIN' && context.role !== 'GESTOR') {
            return NextResponse.json({ message: 'Ação não permitida.' }, { status: 403 });
        }

        // Garante que não se pode deletar a si mesmo
        const membroParaDeletar = await prisma.membroOrganizacao.findUnique({ where: { id: membroId } });
        if (membroParaDeletar?.usuarioId === context.userId) {
            return NextResponse.json({ message: 'Você não pode remover a si mesmo da organização.' }, { status: 403 });
        }

        await prisma.membroOrganizacao.delete({
            where: { id: membroId },
        });

        return NextResponse.json({ message: 'Membro removido com sucesso.' }, { status: 200 });

    } catch (error) {
        console.error('[API Membros DELETE]', error);
        return NextResponse.json({ message: 'Erro ao remover membro.' }, { status: 500 });
    }
}


export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);
