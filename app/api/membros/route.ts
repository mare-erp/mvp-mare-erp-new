// app/api/membros/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

interface TokenPayload { userId: string; empresaId: string; role: string; }

// Schema para validar os dados de um novo convite
const inviteSchema = z.object({
  email: z.string().email("O e-mail fornecido é inválido."),
  nome: z.string().min(3, "O nome é obrigatório."),
  role: z.enum(['OPERADOR', 'VISUALIZADOR']),
  // A senha é opcional, mas se for enviada, deve ter no mínimo 6 caracteres
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").optional().or(z.literal('')),
});

// --- FUNÇÃO GET (COMPLETA E CORRIGIDA) ---
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    const membros = await prisma.membro.findMany({
      where: { empresaId: empresaId },
      include: {
        usuario: { select: { nome: true, email: true } },
      },
      orderBy: {
        usuario: { nome: 'asc' }
      }
    });

    return NextResponse.json(membros);

  } catch (error) {
    return NextResponse.json({ message: 'Token inválido ou erro interno.' }, { status: 500 });
  }
}

// --- FUNÇÃO POST (COMPLETA E CORRIGIDA) ---
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  
    const { empresaId, role: gestorRole } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    if (gestorRole !== 'GESTOR') {
      return NextResponse.json({ message: 'Ação não permitida.' }, { status: 403 });
    }

    const body = await request.json();
    const validation = inviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, nome, role, senha } = validation.data;

    const novoMembro = await prisma.$transaction(async (tx) => {
      let usuario = await tx.usuario.findUnique({ where: { email } });

      if (!usuario) {
        // Usa a senha fornecida ou gera uma temporária se o campo estiver vazio
        const senhaParaSalvar = (senha && senha.length >= 6) ? senha : Math.random().toString(36).slice(-8);
        const senhaHash = await bcrypt.hash(senhaParaSalvar, 10);
        
        if (!senha || senha.length < 6) {
          console.log(`SENHA TEMPORÁRIA PARA ${email}: ${senhaParaSalvar}`);
        }

        usuario = await tx.usuario.create({
          data: { email, nome, senhaHash },
        });
      }

      const existingMembership = await tx.membro.findUnique({
        where: { empresaId_usuarioId: { empresaId, usuarioId: usuario.id } },
      });
      if (existingMembership) {
        throw new Error("Este usuário já faz parte da sua equipe.");
      }

      return await tx.membro.create({
        data: { usuarioId: usuario.id, empresaId, role },
        include: { usuario: { select: { nome: true, email: true } } },
      });
    });

    return NextResponse.json(novoMembro, { status: 201 });

  } catch (error: any) {
    if (error.message.includes("já faz parte")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erro ao processar o convite.' }, { status: 500 });
  }
}