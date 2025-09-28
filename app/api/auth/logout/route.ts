import { NextRequest, NextResponse } from 'next/server';
import { logAuditoria, verifyToken } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Tentar obter informações do usuário para log de auditoria
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (token) {
      try {
        const payload = verifyToken(token);
        
        // Log de auditoria
        await logAuditoria(
          payload.userId,
          payload.organizacaoId,
          null,
          'LOGOUT',
          'Usuario',
          payload.userId,
          {},
          request
        );
      } catch (error) {
        // Token inválido, mas ainda assim fazer logout
        console.log('Token inválido no logout, mas prosseguindo...');
      }
    }

    const response = NextResponse.json({
      message: 'Logout realizado com sucesso'
    });

    // Remover cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

