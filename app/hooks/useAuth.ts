'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  fotoPerfil?: string;
}

interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  logoUrl?: string;
}

interface Organizacao {
  id: string;
  nome: string;
  empresas: Empresa[];
}

interface AuthContextType {
  usuario: Usuario | null;
  organizacao: Organizacao | null;
  empresaSelecionada: string | null;
  role: string | null;
  permissoes: any;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setEmpresaSelecionada: (empresaId: string | null) => void;
  hasPermission: (modulo: string, acao: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [organizacao, setOrganizacao] = useState<Organizacao | null>(null);
  const [empresaSelecionada, setEmpresaSelecionadaState] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissoes, setPermissoes] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, []);

  // Salvar empresa selecionada no localStorage
  useEffect(() => {
    if (empresaSelecionada) {
      localStorage.setItem('empresaSelecionada', empresaSelecionada);
    } else {
      localStorage.removeItem('empresaSelecionada');
    }
  }, [empresaSelecionada]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsuario(data.user);
        setOrganizacao(data.organizacao);
        setRole(data.role);
        setPermissoes(data.permissoes);

        // Restaurar empresa selecionada do localStorage
        const empresaSalva = localStorage.getItem('empresaSelecionada');
        if (empresaSalva && data.organizacao.empresas.some((e: Empresa) => e.id === empresaSalva)) {
          setEmpresaSelecionadaState(empresaSalva);
        } else if (data.organizacao.empresas.length > 0) {
          setEmpresaSelecionadaState(data.organizacao.empresas[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsuario(data.user);
        setOrganizacao(data.user.organizacao);
        setRole(data.user.role);
        setPermissoes(data.user.permissoes);

        // Definir primeira empresa como padrão
        if (data.user.organizacao.empresas.length > 0) {
          setEmpresaSelecionadaState(data.user.organizacao.empresas[0].id);
        }

        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUsuario(null);
      setOrganizacao(null);
      setEmpresaSelecionadaState(null);
      setRole(null);
      setPermissoes(null);
      localStorage.removeItem('empresaSelecionada');
      router.push('/login');
    }
  };

  const setEmpresaSelecionada = (empresaId: string | null) => {
    setEmpresaSelecionadaState(empresaId);
  };

  const hasPermission = (modulo: string, acao: string): boolean => {
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
  };

  const value: AuthContextType = {
    usuario,
    organizacao,
    empresaSelecionada,
    role,
    permissoes,
    isLoading,
    login,
    logout,
    setEmpresaSelecionada,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}