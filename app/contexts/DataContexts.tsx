'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Tipagem para os dados
interface Cliente { id: string; nome: string; }
interface Produto { id: string; nome: string; preco: number; tipo: string; }
interface Membro { id: string; usuario: { nome: string }; usuarioId: string; }

// Tipagem do Contexto
interface DataContextType {
  clientes: Cliente[];
  produtos: Produto[];
  membros: Membro[];
  fetchClientes: () => Promise<void>;
  fetchProdutos: () => Promise<void>;
  fetchMembros: () => Promise<void>;
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
    try {
      const res = await fetch('/api/produtos');
      if (res.ok) {
        const data = await res.json();
        setProdutos(data);
      }
    } catch (error) { console.error("Falha ao buscar produtos:", error); }
  }, []);

  const fetchMembros = useCallback(async () => {
    try {
      const res = await fetch('/api/configuracoes/membros');
       if (res.ok) {
        const data = await res.json();
        setMembros(data);
      }
    } catch (error) { console.error("Falha ao buscar membros:", error); }
  }, []);

  const value = {
    clientes,
    produtos,
    membros,
    fetchClientes,
    fetchProdutos,
    fetchMembros,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};