import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';

interface TokenPayload { userId: string; empresaId: string; role: string; }

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const membroIdParaDeletar = params.id;
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { empresaId, role: gestorRole } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    if (gestorRole !== 'GESTOR') {
      return NextResponse.json({ message: 'Ação não permitida.' }, { status: 403 });
    }

    const membro = await prisma.membro.findUnique({
      where: { id: membroIdParaDeletar },
    });

    if (!membro || membro.empresaId !== empresaId) {
      return NextResponse.json({ message: 'Membro não encontrado ou não pertence à sua empresa.' }, { status: 404 });
    }
    
    if (membro.role === 'GESTOR') {
        return NextResponse.json({ message: 'Um gestor não pode ser removido da própria empresa.' }, { status: 400 });
    }

    await prisma.membro.delete({
      where: { id: membroIdParaDeletar },
    });

    return NextResponse.json({ message: 'Membro removido com sucesso.' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Erro ao processar a solicitação.' }, { status: 500 });
  }
}