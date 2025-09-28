import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { RoleOrganizacao } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  organizacaoId: string;
  empresaId?: string;
  role: RoleOrganizacao;
  permissoes?: any;
}

export interface AuthContext {
  userId: string;
  organizacaoId: string;
  empresaId?: string;
  role: RoleOrganizacao;
  permissoes?: any;
}

// Rate limiting storage (em produção usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Rate limiting por endpoint
const RATE_LIMITS = {
  '/api/auth/login': { requests: 5, window: 15 * 60 * 1000 }, // 5 tentativas por 15min
  '/api/auth/signup': { requests: 3, window: 60 * 60 * 1000 }, // 3 cadastros por hora
  '/api/pedidos': { requests: 150, window: 60 * 60 * 1000 }, // 150 pedidos por hora
  '/api/clientes': { requests: 150, window: 60 * 60 * 1000 }, // 150 operações por hora
  '/api/produtos': { requests: 150, window: 60 * 60 * 1000 }, // 150 operações por hora
  '/api/financeiro': { requests: 150, window: 60 * 60 * 1000 }, // 150 operações por hora
  '/api/estoque': { requests: 150, window: 60 * 60 * 1000 }, // 150 operações por hora
  'global': { requests: 150, window: 60 * 60 * 1000 } // 150 requests totais/hora
};

export function checkRateLimit(req: NextRequest): void {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const pathname = req.nextUrl.pathname;
  const userAgent = req.headers.get('user-agent') || '';
  
  // Detecção básica de bot
  const suspiciousUserAgents = ['bot', 'crawler', 'spider', 'scraper'];
  if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    throw new RateLimitError('Bot detected');
  }

  // Verificar rate limit específico do endpoint
  const endpointLimit = Object.entries(RATE_LIMITS).find(([path]) => 
    pathname.startsWith(path) && path !== 'global'
  )?.[1] || RATE_LIMITS.global;

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const stored = rateLimitStore.get(key);

  if (!stored || now > stored.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + endpointLimit.window });
    return;
  }

  if (stored.count >= endpointLimit.requests) {
    throw new RateLimitError(`Rate limit exceeded for ${pathname}`);
  }

  stored.count++;
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch (error) {
    throw new AuthError('Token inválido');
  }
}

export async function verifyOrganizationAccess(
  userId: string, 
  organizacaoId: string
): Promise<boolean> {
  const membro = await prisma.membroOrganizacao.findUnique({
    where: {
      organizacaoId_usuarioId: {
        organizacaoId,
        usuarioId
      }
    }
  });

  return membro?.ativo === true;
}

export async function verifyCompanyAccess(
  organizacaoId: string,
  empresaId: string
): Promise<boolean> {
  const empresa = await prisma.empresa.findFirst({
    where: {
      id: empresaId,
      organizacaoId,
      ativa: true
    }
  });

  return !!empresa;
}

export async function getUserPermissions(
  userId: string,
  organizacaoId: string
): Promise<{ role: RoleOrganizacao; permissoes?: any }> {
  const membro = await prisma.membroOrganizacao.findUnique({
    where: {
      organizacaoId_usuarioId: {
        organizacaoId,
        usuarioId
      }
    }
  });

  if (!membro || !membro.ativo) {
    throw new AuthError('Usuário não tem acesso a esta organização');
  }

  return {
    role: membro.role,
    permissoes: membro.permissoes
  };
}

export function hasPermission(
  role: RoleOrganizacao,
  permissoes: any,
  modulo: string,
  acao: string
): boolean {
  // Admin tem todas as permissões
  if (role === 'ADMIN') return true;

  // Gestor tem quase todas as permissões (exceto alterar admin)
  if (role === 'GESTOR') {
    if (modulo === 'usuarios' && acao === 'alterar_admin') return false;
    return true;
  }

  // Visualizador só pode visualizar
  if (role === 'VISUALIZADOR') {
    return acao === 'visualizar' || acao === 'acessar';
  }

  // Operador usa permissões personalizadas
  if (role === 'OPERADOR' && permissoes) {
    return permissoes[modulo]?.[acao] === true;
  }

  return false;
}

export async function logAuditoria(
  userId: string,
  organizacaoId: string,
  empresaId: string | null,
  acao: string,
  entidade: string,
  entidadeId?: string,
  detalhes?: any,
  req?: NextRequest
) {
  try {
    await prisma.logAuditoria.create({
      data: {
        acao: acao as any,
        tabela: entidade,
        registroId: entidadeId,
        dadosAntigos: detalhes ? JSON.stringify(detalhes) : null,
        ip: req?.ip || req?.headers.get('x-forwarded-for') || null,
        userAgent: req?.headers.get('user-agent') || null,
        usuarioId: userId,
        empresaId: empresaId || 'unknown'
      }
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
}

// Middleware principal para APIs
export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options: {
    requireCompany?: boolean;
    requiredPermission?: { modulo: string; acao: string };
  } = {}
) {
  return async (req: NextRequest) => {
    try {
      // Rate limiting
      checkRateLimit(req);

      // Verificar token
      const authHeader = req.headers.get('authorization');
      const cookieToken = req.cookies.get('auth-token')?.value;
      const token = authHeader?.replace('Bearer ', '') || cookieToken;

      if (!token) {
        throw new AuthError('Token não fornecido');
      }

      const payload = verifyToken(token);

      // Verificar acesso à organização
      const hasOrgAccess = await verifyOrganizationAccess(payload.userId, payload.organizacaoId);
      if (!hasOrgAccess) {
        throw new AuthError('Acesso negado à organização');
      }

      // Verificar acesso à empresa (se necessário)
      if (options.requireCompany && payload.empresaId) {
        const hasCompanyAccess = await verifyCompanyAccess(payload.organizacaoId, payload.empresaId);
        if (!hasCompanyAccess) {
          throw new AuthError('Acesso negado à empresa');
        }
      }

      // Verificar permissões específicas
      if (options.requiredPermission) {
        const { modulo, acao } = options.requiredPermission;
        const hasPermission = hasPermission(payload.role, payload.permissoes, modulo, acao);
        if (!hasPermission) {
          throw new AuthError('Permissão insuficiente');
        }
      }

      const context: AuthContext = {
        userId: payload.userId,
        organizacaoId: payload.organizacaoId,
        empresaId: payload.empresaId,
        role: payload.role,
        permissoes: payload.permissoes
      };

      return await handler(req, context);

    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }

      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      console.error('Erro no middleware de auth:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  };
}

// Função para gerar token JWT
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
}

// Função para atualizar último login
export async function updateLastLogin(userId: string): Promise<void> {
  await prisma.usuario.update({
    where: { id: userId },
    data: { ultimoLogin: new Date() }
  });
}

