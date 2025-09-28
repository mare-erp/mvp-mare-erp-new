// app/(dashboard)/page.tsx

'use client'; // Esta página agora precisa de interatividade no cliente

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Componente para exibir um estado de carregamento
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#003846]"></div>
  </div>
);

// Componente para os cards do dashboard
const StatCard = ({ title, value, subtext }: { title: string; value: string | number; subtext: string }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    <p className="mt-1 text-xs text-gray-500">{subtext}</p>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ nome: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Função que busca os dados do usuário no backend
    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          // Se a resposta NÃO for OK (ex: 401 Não Autorizado), força o logout
          router.push('/login');
          return;
        }

        const data = await response.json();
        setUser(data.user); // Armazena os dados do usuário
      } catch (error) {
        // Se houver qualquer erro de rede, também redireciona para o login por segurança
        console.error('Falha ao verificar a sessão:', error);
        router.push('/login');
      } finally {
        setIsLoading(false); // Termina o carregamento
      }
    };

    verifySession();
  }, [router]); // O array de dependências garante que o efeito rode apenas uma vez

  // Enquanto a verificação estiver acontecendo, exibe um spinner de carregamento
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Se a verificação for bem-sucedida, exibe o conteúdo do dashboard
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Bem-vindo de volta, {user?.nome}! Este é o seu painel de controle.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Vendas do Mês" value="R$ 0,00" subtext="Ainda sem dados" />
        <StatCard title="Clientes Ativos" value="0" subtext="Ainda sem dados" />
        <StatCard title="Contas a Receber" value="R$ 0,00" subtext="Ainda sem dados" />
        <StatCard title="Produtos em Estoque" value="0" subtext="Ainda sem dados" />
      </div>
    </div>
  );
}