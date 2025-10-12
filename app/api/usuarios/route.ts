
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';

import bcrypt from 'bcryptjs';

import { withAuth, AuthContext } from '@/app/lib/auth';



async function getHandler(req: NextRequest, context: AuthContext) {

  try {

    const membros = await prisma.membroOrganizacao.findMany({

      where: {

        organizacaoId: context.organizacaoId,

      },

      select: {

        usuario: {

          select: {

            id: true,

            nome: true,

            email: true,

            role: true,

            ativo: true,

          },

        },

      },

    });



    const usuarios = membros.map(membro => membro.usuario);

    return NextResponse.json(usuarios);

  } catch (error) {

    console.error('Erro ao buscar usuários:', error);

    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });

  }

}



async function postHandler(request: NextRequest, context: AuthContext) {

  try {

    const { nome, email, role, ativo, senha } = await request.json();



    if (!nome || !email || !role || !senha) {

      return NextResponse.json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' }, { status: 400 });

    }



    const hashedPassword = await bcrypt.hash(senha, 10);



    // Lógica para adicionar o novo usuário à organização atual

    const novoUsuario = await prisma.usuario.create({

      data: {

        nome,

        email,

        senhaHash: hashedPassword, // Corrigido para o nome do campo no schema

        role,

        ativo: ativo ?? true,

        organizacoes: {

          create: [

            {

              organizacaoId: context.organizacaoId,

              role: role, // Atribui a role da organização

            },

          ],

        },

      },

    });



    return NextResponse.json(novoUsuario, { status: 201 });

  } catch (error: any) {

    console.error('Erro ao criar usuário:', error);

    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {

      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 409 });

    }

    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });

  }

}



export const GET = withAuth(getHandler);

export const POST = withAuth(postHandler);



