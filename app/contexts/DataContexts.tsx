'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Tipagem para os dados que vamos compartilhar
interface Cliente { id: string; nome: string; }
interface Produto { id: string; nome: string; preco: number; tipo: string; }
interface Membro { id: string; usuario: { nome: string }; usuarioId: string; }

interface DataContextType {
  clientes: Cliente[];
  produtos: Produto[];
  membros: Membro[];
  isLoading: boolean;
  refetchClientes: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch('/api/clientes');
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      }
    } catch (error) { console.error("Falha ao buscar clientes:", error); }
  }, []);

  const fetchProdutos = useCallback(async () => {
    // NOTA: Esta API ainda não existe. Retornará um array vazio por enquanto.
    // Vamos criá-la no módulo de Estoque.
    setProdutos([]);
  }, []);

  const fetchMembros = useCallback(async () => {
    try {
      const res = await fetch('/api/membros');
       if (res.ok) {
        const data = await res.json();
        setMembros(data);
      }
    } catch (error) { console.error("Falha ao buscar membros:", error); }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchClientes(),
        fetchProdutos(),
        fetchMembros()
      ]);
      setIsLoading(false);
    };
    fetchAllData();
  }, [fetchClientes, fetchProdutos, fetchMembros]);

  const value = {
    clientes,
    produtos,
    membros,
    isLoading,
    refetchClientes: fetchClientes,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};