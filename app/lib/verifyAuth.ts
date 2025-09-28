import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface TokenPayload {
  userId: string;
  empresaId: string;
  organizacaoId?: string;
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
