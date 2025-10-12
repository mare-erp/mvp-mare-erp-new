import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { generateToken, logAuditoria, checkRateLimit } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    checkRateLimit(request);

    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organizacoes: {
          include: {
            organizacao: {
              include: {
                empresas: {
                  where: { ativa: true }
                }
              }
            }
          }
        }
      }
    });

    if (!usuario || !usuario.ativo) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Filtrar organizações ativas
    const organizacoesAtivas = usuario.organizacoes.filter(org => org.ativo);
    
    // Verificar se usuário tem organizações ativas
    if (organizacoesAtivas.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não pertence a nenhuma organização ativa' },
        { status: 403 }
      );
    }

    // Pegar primeira organização (ou deixar usuário escolher se tiver múltiplas)
    const primeiraOrganizacao = organizacoesAtivas[0];
    const organizacao = primeiraOrganizacao.organizacao;

    // Gerar token
    const tokenPayload = {
      userId: usuario.id,
      organizacaoId: organizacao.id,
      empresaId: organizacao.empresas[0]?.id, // Primeira empresa como padrão
      role: primeiraOrganizacao.role,
      permissoes: primeiraOrganizacao.permissoes
    };

    const token = generateToken(tokenPayload);

    // Atualizar último login
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() }
    });

    // Log de auditoria
    await logAuditoria(
      usuario.id,
      organizacao.id,
      organizacao.empresas[0]?.id || null,
      'LOGIN',
      'Usuario',
      usuario.id,
      { email },
      request
    );

    // Preparar dados do usuário para resposta
    const userData = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      fotoPerfil: usuario.fotoPerfil,
      organizacao: {
        id: organizacao.id,
        nome: organizacao.nome,
        empresas: organizacao.empresas.map(emp => ({
          id: emp.id,
          nome: emp.nome,
          cnpj: emp.cnpj,
          logoUrl: emp.logoUrl
        }))
      },
      role: primeiraOrganizacao.role,
      permissoes: primeiraOrganizacao.permissoes,
      organizacoes: organizacoesAtivas.map(membro => ({
        id: membro.organizacao.id,
        nome: membro.organizacao.nome,
        role: membro.role
      }))
    };

    const response = NextResponse.json({
      message: 'Login realizado com sucesso',
      user: userData,
      token
    });

    // Definir cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 horas
    });

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

