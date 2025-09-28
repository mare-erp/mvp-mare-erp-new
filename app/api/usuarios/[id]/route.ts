
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        ultimoLogin: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { nome, email, role, ativo, senha } = await request.json();

    const existingUser = await prisma.usuario.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    let hashedPassword = existingUser.senha;
    if (senha) {
      hashedPassword = await bcrypt.hash(senha, 10);
    }

    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: {
        nome: nome ?? existingUser.nome,
        email: email ?? existingUser.email,
        role: role ?? existingUser.role,
        ativo: ativo ?? existingUser.ativo,
        senha: hashedPassword,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        ultimoLogin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ message: 'Este e-mail já está em uso por outro usuário.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const existingUser = await prisma.usuario.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    await prisma.usuario.delete({ where: { id } });

    return NextResponse.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

