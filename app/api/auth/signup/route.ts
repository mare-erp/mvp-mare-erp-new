import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    console.log("Recebida requisição de registro...");
    const { name, email, companyName, password } = await request.json();
    console.log("Dados recebidos:", { name, email, companyName });

    if (!name || !email || !companyName || !password) {
      console.log("Erro: Campos obrigatórios ausentes.");
      return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    console.log("Verificando se o usuário já existe...");
    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      console.log("Erro: Usuário com este e-mail já existe.");
      return NextResponse.json({ message: 'Usuário com este e-mail já existe.' }, { status: 409 });
    }

    console.log("Criptografando a senha...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Iniciando transação no banco de dados...");
    const result = await prisma.$transaction(async (prisma) => {
      console.log("Passo 1/4: Criando usuário...");
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome: name,
          email,
          senhaHash: hashedPassword,
        },
      });
      console.log("--> Usuário criado com ID:", novoUsuario.id);

      console.log("Passo 2/4: Criando organização...");
      const novaOrganizacao = await prisma.organizacao.create({
        data: {
          nome: companyName,
          adminId: novoUsuario.id,
        },
      });
      console.log("--> Organização criada com ID:", novaOrganizacao.id);

      console.log("Passo 3/4: Criando membro da organização...");
      await prisma.membroOrganizacao.create({
        data: {
          organizacaoId: novaOrganizacao.id,
          usuarioId: novoUsuario.id,
          role: 'ADMIN',
        },
      });
      console.log("--> Membro da organização criado.");

      console.log("Passo 4/4: Criando empresa...");
      const novaEmpresa = await prisma.empresa.create({
        data: {
          nome: companyName,
          organizacaoId: novaOrganizacao.id,
        },
      });
      console.log("--> Empresa criada com ID:", novaEmpresa.id);

      return { novoUsuario, novaOrganizacao, novaEmpresa };
    });

    const { novoUsuario, novaOrganizacao, novaEmpresa } = result;
    console.log("Transação concluída com sucesso.");

    console.log("Gerando token JWT...");
    const token = jwt.sign(
      { userId: novoUsuario.id, organizacaoId: novaOrganizacao.id, empresaId: novaEmpresa.id, role: 'ADMIN' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    console.log("Enviando resposta...");
    const response = NextResponse.json(
      { message: 'Usuário e empresa registrados com sucesso!', user: { id: novoUsuario.id, name: novoUsuario.nome, email: novoUsuario.email, organizacaoId: novaOrganizacao.id, empresaId: novaEmpresa.id, role: 'ADMIN' } },
      { status: 201 }
    );
    response.cookies.set('auth-token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600 });

    return response;
  } catch (error) {
    console.error("ERRO CRÍTICO NO PROCESSO DE CADASTRO:", error);
    if (error instanceof Error && error.message.includes('Unique constraint failed on the fields: (`email`)')) {
      return NextResponse.json({ message: 'Um usuário com este e-mail já existe.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Ocorreu um erro interno no servidor durante o cadastro.' }, { status: 500 });
  }
}

