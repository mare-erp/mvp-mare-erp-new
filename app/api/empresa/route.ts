import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';

interface TokenPayload { empresaId: string; }

const updateEmpresaSchema = z.object({
  nome: z.string().min(2, "O nome da empresa é obrigatório."),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
});

// --- FUNÇÃO GET CORRIGIDA E COMPLETA ---
export async function GET(request: Request) {
  console.log('\n--- NOVA REQUISIÇÃO GET /api/empresa ---');
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    console.error('ERRO (GET): Token não encontrado nos cookies.');
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    console.log('Token encontrado (GET). Verificando...');
    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    console.log(`Token válido (GET). Buscando ID da Empresa: ${empresaId}`);
    
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      console.error(`ERRO (GET): Empresa com ID ${empresaId} não encontrada no banco de dados.`);
      return NextResponse.json({ message: 'Empresa não encontrada.' }, { status: 404 });
    }

    console.log('Sucesso (GET)! Empresa encontrada:', empresa.nome);
    return NextResponse.json(empresa);

  } catch (error) {
    console.error('ERRO GERAL NO BLOCO TRY/CATCH (GET):', error);
    return NextResponse.json({ message: 'Token inválido ou erro interno.' }, { status: 401 });
  }
}

// --- FUNÇÃO PUT (JÁ FUNCIONANDO, COM DIAGNÓSTICOS) ---
export async function PUT(request: Request) {
  console.log('\n--- NOVA REQUISIÇÃO PUT /api/empresa ---');
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    console.error('ERRO (PUT): Token não encontrado nos cookies.');
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    console.log('Token encontrado (PUT). Verificando...');
    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    console.log(`Token válido (PUT). ID da Empresa: ${empresaId}`);

    const body = await request.json();
    console.log('Dados recebidos do frontend (PUT):', body);

    const validation = updateEmpresaSchema.safeParse(body);
    if (!validation.success) {
      console.error('ERRO (PUT): Falha na validação do Zod.', validation.error.flatten());
      return NextResponse.json({ message: "Dados inválidos.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    console.log('Dados validados com sucesso (PUT). Atualizando no banco de dados...');
    const data = validation.data;

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        nome: data.nome,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        email: data.email || null,
        cep: data.cep || null,
        rua: data.rua || null,
        numero: data.numero || null,
        complemento: data.complemento || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        uf: data.uf || null,
      },
    });

    console.log('Sucesso (PUT)! Empresa atualizada:', empresaAtualizada);
    return NextResponse.json(empresaAtualizada);

  } catch (error) {
    console.error('ERRO GERAL NO BLOCO TRY/CATCH (PUT):', error);
    return NextResponse.json({ message: 'Token inválido ou erro ao atualizar.' }, { status: 401 });
  }
}