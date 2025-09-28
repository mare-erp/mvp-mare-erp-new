'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useCompany } from './CompanyContext';

// Tipagem para os dados que vamos compartilhar
interface Cliente { id: string; nome: string; }
interface Produto { id: string; nome: string; preco: number; tipo: string; }
interface Membro { id: string; usuario: { nome: string }; usuarioId: string; }

interface DashboardDataContextType {
  clientes: Cliente[];
  produtos: Produto[];
  membros: Membro[];
  isLoading: boolean;
  refetchClientes: () => void;
  refetchProdutos: () => void;
  refetchMembros: () => void;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export const useDashboardData = () => {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData deve ser usado dentro de um DashboardDataProvider');
  }
  return context;
};

export const DashboardDataProvider = ({ children }: { children: ReactNode }) => {
  const { empresaSelecionada } = useCompany();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const buildUrl = (baseUrl: string) => {
    return empresaSelecionada ? `${baseUrl}?empresaId=${empresaSelecionada}` : baseUrl;
  };

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch(buildUrl('/api/clientes'));
      if (res.ok) setClientes(await res.json());
    } catch (error) { console.error("Falha ao buscar clientes:", error); }
  }, [empresaSelecionada]);

  const fetchProdutos = useCallback(async () => {
    try {
      const res = await fetch(buildUrl('/api/produtos'));
      if (res.ok) setProdutos(await res.json());
    } catch (error) { console.error("Falha ao buscar produtos:", error); }
  }, [empresaSelecionada]);

  const fetchMembros = useCallback(async () => {
    try {
      const res = await fetch('/api/membros');
       if (res.ok) setMembros(await res.json());
    } catch (error) { console.error("Falha ao buscar membros:", error); }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([fetchClientes(), fetchProdutos(), fetchMembros()]);
      setIsLoading(false);
    };
    fetchAllData();
  }, [empresaSelecionada, fetchClientes, fetchProdutos, fetchMembros]);

  const value = {
    clientes,
    produtos,
    membros,
    isLoading,
    refetchClientes: fetchClientes,
    refetchProdutos: fetchProdutos,
    refetchMembros: fetchMembros,
  };

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
};
