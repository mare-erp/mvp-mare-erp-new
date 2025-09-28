
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
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
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nome, email, role, ativo, senha } = await request.json();

    if (!nome || !email || !role || !senha) {
      return NextResponse.json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        role,
        ativo: ativo ?? true,
        senha: hashedPassword,
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

