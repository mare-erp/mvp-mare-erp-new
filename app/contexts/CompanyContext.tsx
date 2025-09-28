'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface Empresa {
  id: string;
  nome: string;
}

interface Organizacao {
  id: string;
  nome: string;
  empresas: Empresa[];
}

interface CompanyContextType {
  organizacao: Organizacao | null;
  empresaSelecionada: string | null;
  handleEmpresaChange: (empresaId: string | null) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany deve ser usado dentro de um CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [organizacao, setOrganizacao] = useState<Organizacao | null>(null);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizacao = useCallback(async () => {
    setIsLoading(true);
    try {
      // Esta API busca a organização do usuário logado
      const res = await fetch('/api/organizacao/current');
      if (res.ok) {
        const data = await res.json();
        setOrganizacao(data);
        // Define a primeira empresa como selecionada por padrão
        if (data && data.empresas && data.empresas.length > 0) {
          setEmpresaSelecionada(data.empresas[0].id);
        }
      }
    } catch (error) {
      console.error("Falha ao buscar organização:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizacao();
  }, [fetchOrganizacao]);

  const handleEmpresaChange = (empresaId: string | null) => {
    setEmpresaSelecionada(empresaId);
  };

  const value = {
    organizacao,
    empresaSelecionada,
    handleEmpresaChange,
    isLoading,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};
