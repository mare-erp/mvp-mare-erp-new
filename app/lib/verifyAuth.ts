import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

interface TokenPayload {
  userId: string;
  empresaId: string;
  organizacaoId?: string;
  role?: string;
  permissoes?: string[];
}

export async function verifyAuth(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return { success: false, error: 'Não autorizado' };
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    return { 
      success: true, 
      userId: payload.userId, 
      empresaId: payload.empresaId,
      organizacaoId: payload.organizacaoId 
    };
  } catch (error) {
    return { success: false, error: 'Token inválido' };
  }
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
}

export async function logAuditoria(
  usuarioId: string,
  empresaId: string,
  organizacaoId: string | null,
  acao: string,
  tabela: string,
  registroId: string,
  dadosAntigos: any,
  request: NextRequest
) {
  try {
    await prisma.logAuditoria.create({
      data: {
        usuarioId,
        empresaId,
        acao: acao as any,
        tabela,
        registroId,
        dadosAntigos: JSON.stringify(dadosAntigos),
        ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
}

export function checkRateLimit(request: NextRequest) {
  // Implementação básica de rate limiting
  // Em produção, use Redis ou similar
  return true;
}
